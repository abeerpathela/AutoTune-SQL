const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeQuery } = require('../services/analyzerService');
const { predict } = require('../services/mlService');

const submitQuery = async (req, res, next) => {
  try {
    const { sql, connectionId } = req.body;

    const analysis = await analyzeQuery(sql, connectionId);

    const tempLog = {
      isSyntaxValid: analysis.isSyntaxValid,
      joinTypeCount: analysis.joinTypeCount,
      errorCategory: analysis.errorCategory,
    };

    const mlPrediction = predict(analysis.explainPlan, tempLog);

    const queryLog = await prisma.queryLog.create({
      data: {
        originalQuery: analysis.originalQuery,
        executionTime: analysis.executionTime,
        isSlow: analysis.isSlow || false,
        explainPlan: analysis.explainPlan,
        isSyntaxValid: analysis.isSyntaxValid,
        errorCategory: analysis.errorCategory,
        postgresError: analysis.postgresError,
        joinTypeCount: analysis.joinTypeCount,
        logicFlaws: analysis.logicFlaws?.length > 0 ? analysis.logicFlaws : null,
        connectionId: connectionId || null,
        userId: req.user?.id || null,
      },
    });

    if (analysis.structuredError) {
      return res.status(400).json({
        status: 'error',
        errorCategory: analysis.structuredError.errorCategory,
        message: analysis.structuredError.message,
        code: analysis.structuredError.code,
        hint: analysis.structuredError.hint,
        data: {
          id: queryLog.id,
          queryLog,
          analysis,
          mlPrediction,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: queryLog.id,
        mlPrediction,
        executionTime: queryLog.executionTime,
        isSlow: queryLog.isSlow,
        queryLog,
        analysis,
      },
    });
  } catch (error) {
    if (
      error.message === 'Dangerous SQL operations are not allowed.' ||
      error.message === 'Database connection not found' ||
      error.message === 'Only SELECT, WITH, or EXPLAIN queries are allowed.' ||
      error.message === 'SQL query is required'
    ) {
      return res.status(400).json({
        status: 'error',
        errorCategory: 'Validation',
        message: error.message,
        code: 'VALIDATION',
        hint: 'Only read-only SELECT, WITH, or EXPLAIN queries are permitted.',
      });
    }
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await prisma.queryLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        connection: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitQuery,
  getHistory,
};
