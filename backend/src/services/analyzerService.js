const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { detectLogicFlaws } = require('./logicAnalyzer');
const { runExplain } = require('./dbConnector');
const {
  cleanSqlForValidation,
  isReadOnlyQuery,
  findDangerousKeyword,
} = require('../utils/sqlCleaner');
const { classifyPostgresError } = require('../utils/postgresErrorClassifier');

function countNodes(plan, targetTypes) {
  let count = 0;
  if (plan['Node Type']) {
    for (const type of targetTypes) {
      if (plan['Node Type'].includes(type)) {
        count++;
      }
    }
  }
  if (plan.Plans) {
    for (const child of plan.Plans) {
      count += countNodes(child, targetTypes);
    }
  }
  return count;
}

function buildErrorAnalysis(originalQuery, classified) {
  return {
    originalQuery,
    explainPlan: null,
    executionTime: null,
    planRows: 0,
    actualRows: 0,
    startupCost: 0,
    totalCost: 0,
    nodeType: null,
    hasSequentialScan: false,
    roundTripTime: 0,
    joinTypeCount: 0,
    isSyntaxValid: classified.isSyntaxValid,
    errorCategory: classified.errorCategory,
    errorCode: classified.code,
    message: classified.message,
    errorHint: classified.hint,
    postgresError: classified.message,
    structuredError: {
      errorCategory: classified.errorCategory,
      message: classified.message,
      code: classified.code,
      hint: classified.hint,
    },
    logicFlaws: [],
  };
}

async function analyzeQuery(sql, connectionId = null) {
  const originalQuery = typeof sql === 'string' ? sql.trim() : '';
  const cleanedSql = cleanSqlForValidation(originalQuery);

  if (!cleanedSql) {
    throw new Error('SQL query is required');
  }

  const dangerousKeyword = findDangerousKeyword(cleanedSql);
  if (dangerousKeyword) {
    throw new Error('Dangerous SQL operations are not allowed.');
  }

  if (!isReadOnlyQuery(cleanedSql)) {
    throw new Error('Only SELECT, WITH, or EXPLAIN queries are allowed.');
  }

  let connectionConfig = null;
  if (connectionId) {
    const connection = await prisma.dbConnection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) {
      throw new Error('Database connection not found');
    }
    connectionConfig = connection;
  }

  let explainPlan = null;
  let fullExplainPlan = null;

  try {
    if (connectionConfig) {
      const explainResult = await runExplain(connectionConfig, originalQuery);
      explainPlan = explainResult.explainPlan;
      fullExplainPlan = explainResult.fullExplainPlan;
    } else {
      const explainResult = await prisma.$queryRawUnsafe(`EXPLAIN (FORMAT JSON) ${originalQuery}`);
      explainPlan = explainResult[0]['QUERY PLAN'][0];
    }
  } catch (err) {
    const classified = classifyPostgresError(err);
    console.log(`📝 Classified DB Error [${classified.code}]: ${classified.message}`);
    return buildErrorAnalysis(originalQuery, classified);
  }

  console.log('🔍 Running Logic Check on query...');
  const logicFlaws = detectLogicFlaws(originalQuery);
  if (logicFlaws.length > 0) {
    console.log(`✅ Classified as Logic Error, ${logicFlaws.length} flaws found`);
    const plan = explainPlan.Plan;
    return {
      originalQuery,
      explainPlan,
      executionTime: null,
      planRows: plan['Plan Rows'] || 0,
      actualRows: 0,
      startupCost: plan['Startup Cost'] || 0,
      totalCost: plan['Total Cost'] || 0,
      nodeType: plan['Node Type'],
      hasSequentialScan: countNodes(plan, ['Seq Scan']) > 0,
      roundTripTime: 0,
      joinTypeCount: countNodes(plan, ['Hash Join', 'Nested Loop', 'Merge Join']),
      isSyntaxValid: true,
      errorCategory: 'Logic',
      postgresError: null,
      logicFlaws,
    };
  }

  console.log('🚀 Running Performance Check on query...');
  try {
    let plan = null;
    let actualTotalTime = null;
    let roundTripTime = 0;

    if (connectionConfig && fullExplainPlan) {
      plan = fullExplainPlan.Plan;
      actualTotalTime = fullExplainPlan['Execution Time'] || plan['Actual Total Time'];
    } else {
      const startTime = process.hrtime();
      const fullExplainResult = await prisma.$queryRawUnsafe(
        `EXPLAIN (FORMAT JSON, ANALYZE) ${originalQuery}`
      );
      const [seconds, nanoseconds] = process.hrtime(startTime);
      roundTripTime = seconds * 1000 + nanoseconds / 1000000;
      fullExplainPlan = fullExplainResult[0]['QUERY PLAN'][0];
      plan = fullExplainPlan.Plan;
      actualTotalTime = fullExplainPlan['Execution Time'] || plan['Actual Total Time'];
    }

    const hasSeqScan = countNodes(plan, ['Seq Scan']) > 0;
    const planRows = plan['Plan Rows'] || 0;
    const isSlow = actualTotalTime > 100 || (hasSeqScan && planRows > 1000);
    const joinTypes = ['Hash Join', 'Nested Loop', 'Merge Join'];
    const joinTypeCount = countNodes(plan, joinTypes);

    console.log(`✅ Classified as Performance Query, isSlow: ${isSlow}`);
    return {
      originalQuery,
      explainPlan: fullExplainPlan,
      executionTime: actualTotalTime,
      planRows,
      actualRows: plan['Actual Rows'] || 0,
      startupCost: plan['Startup Cost'] || 0,
      totalCost: plan['Total Cost'] || 0,
      nodeType: plan['Node Type'],
      hasSequentialScan: hasSeqScan,
      roundTripTime,
      joinTypeCount,
      isSyntaxValid: true,
      errorCategory: 'Performance',
      postgresError: null,
      logicFlaws: [],
      isSlow,
    };
  } catch (perfErr) {
    const classified = classifyPostgresError(perfErr);
    console.log(`⚠️ Performance Check failed [${classified.code}]: ${classified.message}`);
    return buildErrorAnalysis(originalQuery, classified);
  }
}

module.exports = { analyzeQuery };
