const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeQuery } = require('../services/analyzerService');
const { predict } = require('../services/mlService');

const submitQuery = async (req, res, next) => {
  try {
    const { sql } = req.body;
    
    const analysis = await analyzeQuery(sql);
    const isSlow = analysis.executionTime > 100 || (
      analysis.hasSequentialScan && analysis.planRows > 1000
    );
    
    // Get ML prediction
    const mlPrediction = predict(analysis.explainPlan);
    
    const queryLog = await prisma.queryLog.create({
      data: {
        originalQuery: analysis.originalQuery,
        executionTime: analysis.executionTime,
        isSlow,
        explainPlan: analysis.explainPlan
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        queryLog,
        analysis,
        mlPrediction,
        mlAdvice: mlPrediction.advice
      }
    });
  } catch (error) {
    if (error.code === '42601' || error.message.toLowerCase().includes('syntax')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    if (error.message === 'Dangerous SQL operations are not allowed.') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  submitQuery
};
