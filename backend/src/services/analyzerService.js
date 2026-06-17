const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DANGEROUS_KEYWORDS = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE', 'GRANT', 'REVOKE'];

function sanitizeQuery(sql) {
  const sanitized = sql.trim();
  const upperSql = sanitized.toUpperCase();
  
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (upperSql.includes(keyword)) {
      throw new Error('Dangerous SQL operations are not allowed.');
    }
  }
  
  return sanitized;
}

function findSequentialScan(plan) {
  if (plan['Node Type'] === 'Seq Scan') {
    return true;
  }
  if (plan.Plans) {
    for (const subPlan of plan.Plans) {
      if (findSequentialScan(subPlan)) {
        return true;
      }
    }
  }
  return false;
}

async function analyzeQuery(sql) {
  try {
    const sanitizedSql = sanitizeQuery(sql);
    const explainQuery = `EXPLAIN (FORMAT JSON, ANALYZE) ${sanitizedSql}`;
    
    const startTime = process.hrtime();
    const result = await prisma.$queryRawUnsafe(explainQuery);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const roundTripTime = seconds * 1000 + nanoseconds / 1000000;
    
    const explainPlan = result[0]['QUERY PLAN'][0];
    const plan = explainPlan['Plan'];
    const actualTotalTime = explainPlan['Execution Time'] || plan['Actual Total Time'];
    
    return {
      originalQuery: sanitizedSql,
      explainPlan,
      executionTime: actualTotalTime,
      planRows: plan['Plan Rows'],
      actualRows: plan['Actual Rows'],
      startupCost: plan['Startup Cost'],
      totalCost: plan['Total Cost'],
      nodeType: plan['Node Type'],
      hasSequentialScan: findSequentialScan(plan),
      roundTripTime
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  analyzeQuery
};
