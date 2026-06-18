const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDatasetStats = async (req, res, next) => {
  try {
    // First, get total queries
    const totalQueries = await prisma.queryLog.count();
    
    // Now group by errorCategory
    const categoryCounts = await prisma.queryLog.groupBy({
      by: ['errorCategory'],
      _count: {
        id: true
      }
    });
    
    // Initialize all counters
    let syntaxErrors = 0;
    let logicErrors = 0;
    let performanceQueries = 0;
    let unknownQueries = 0;
    
    // Count each category
    for (const group of categoryCounts) {
      const category = group.errorCategory;
      const count = group._count.id;
      
      if (category === 'Syntax') {
        syntaxErrors = count;
      } else if (category === 'Logic') {
        logicErrors = count;
      } else if (category === 'Performance') {
        performanceQueries = count;
      } else {
        unknownQueries += count;
      }
    }
    
    // Calculate other stats
    const slowQueries = await prisma.queryLog.count({
      where: { isSlow: true, errorCategory: 'Performance' }
    });
    
    const fastQueries = await prisma.queryLog.count({
      where: { isSlow: false, errorCategory: 'Performance' }
    });
    
    const avgExecTimeResult = await prisma.queryLog.aggregate({
      _avg: { executionTime: true },
      where: { executionTime: { not: null } }
    });
    
    const recordsWithExplainPlans = await prisma.queryLog.count({
      where: { explainPlan: { not: null } }
    });
    
    // Add verification logs!
    console.log('📊 Dataset Stats Verification:');
    console.log('  Total QueryLogs:', totalQueries);
    console.log('  Performance Records:', performanceQueries);
    console.log('  Syntax Records:', syntaxErrors);
    console.log('  Logic Records:', logicErrors);
    console.log('  Unknown Records:', unknownQueries);
    console.log('  Check Sum:', syntaxErrors + logicErrors + performanceQueries + unknownQueries, '=', totalQueries);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalQueries,
        slowQueries,
        fastQueries,
        syntaxErrors,
        logicErrors,
        performanceQueries,
        unknownQueries,
        averageExecutionTime: avgExecTimeResult._avg.executionTime || 0,
        recordsWithExplainPlans
      }
    });
  } catch (error) {
    console.error('❌ Error getting dataset stats:', error);
    next(error);
  }
};

module.exports = { getDatasetStats };
