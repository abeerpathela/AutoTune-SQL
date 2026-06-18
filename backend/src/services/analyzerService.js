const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { detectLogicFlaws } = require('./logicAnalyzer');

const DANGEROUS_KEYWORDS = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE', 'GRANT', 'REVOKE'];

// Recursively count occurrences of node types
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

// Main analyze function - STRINGENT priority order
async function analyzeQuery(sql) {
  const sanitized = sql.trim();
  
  // Check dangerous first
  const upperSql = sanitized.toUpperCase();
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (upperSql.includes(keyword)) {
      throw new Error('Dangerous SQL operations are not allowed.');
    }
  }

  // ---------------------------
  // Step 1: Syntax Check FIRST
  // ---------------------------
  let explainPlan = null;
  let isSyntaxValid = true;
  let postgresError = null;
  
  try {
    const explainResult = await prisma.$queryRawUnsafe(`EXPLAIN (FORMAT JSON) ${sanitized}`);
    explainPlan = explainResult[0]['QUERY PLAN'][0];
  } catch (err) {
    isSyntaxValid = false;
    postgresError = err.message;
    console.log(`📝 Detected Syntax Error: ${err.message}`);
    return {
      originalQuery: sanitized,
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
      isSyntaxValid: false,
      errorCategory: 'Syntax',
      postgresError: err.message,
      logicFlaws: []
    };
  }

  // ---------------------------
  // Step 2: Logic Check NEXT
  // ---------------------------
  console.log(`🔍 Running Logic Check on query...`);
  const logicFlaws = detectLogicFlaws(sanitized);
  if (logicFlaws.length > 0) {
    console.log(`✅ Classified as Logic Error, ${logicFlaws.length} flaws found`);
    // Calculate some basic stats from the EXPLAIN (without ANALYZE)
    const plan = explainPlan.Plan;
    return {
      originalQuery: sanitized,
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
      logicFlaws
    };
  }

  // ---------------------------
  // Step 3: Performance Check LAST
  // ---------------------------
  console.log(`🚀 Running Performance Check on query...`);
  try {
    const startTime = process.hrtime();
    const fullExplainResult = await prisma.$queryRawUnsafe(`EXPLAIN (FORMAT JSON, ANALYZE) ${sanitized}`);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const roundTripTime = seconds * 1000 + nanoseconds / 1000000;

    const fullExplainPlan = fullExplainResult[0]['QUERY PLAN'][0];
    const plan = fullExplainPlan.Plan;
    const actualTotalTime = fullExplainPlan['Execution Time'] || plan['Actual Total Time'];
    const hasSeqScan = countNodes(plan, ['Seq Scan']) > 0;
    const planRows = plan['Plan Rows'] || 0;
    const isSlow = actualTotalTime > 100 || (hasSeqScan && planRows > 1000);
    const joinTypes = ['Hash Join', 'Nested Loop', 'Merge Join'];
    const joinTypeCount = countNodes(plan, joinTypes);

    console.log(`✅ Classified as Performance Query, isSlow: ${isSlow}`);
    return {
      originalQuery: sanitized,
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
      isSlow
    };
  } catch (perfErr) {
    console.log(`⚠️ Performance Check failed, falling back to Unknown category`);
    return {
      originalQuery: sanitized,
      explainPlan,
      executionTime: null,
      planRows: explainPlan.Plan['Plan Rows'] || 0,
      actualRows: 0,
      startupCost: explainPlan.Plan['Startup Cost'] || 0,
      totalCost: explainPlan.Plan['Total Cost'] || 0,
      nodeType: explainPlan.Plan['Node Type'],
      hasSequentialScan: countNodes(explainPlan.Plan, ['Seq Scan']) > 0,
      roundTripTime: 0,
      joinTypeCount: countNodes(explainPlan.Plan, ['Hash Join', 'Nested Loop', 'Merge Join']),
      isSyntaxValid: true,
      errorCategory: 'Unknown',
      postgresError: perfErr.message,
      logicFlaws: []
    };
  }
}

module.exports = { analyzeQuery };
