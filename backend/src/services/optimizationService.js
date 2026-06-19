const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const getRedisClient = require('../config/redis');
const { optimizeSQL } = require('./aiService');
const { getSchemaMetadata } = require('./dbConnector');

const CACHE_TTL = 86400; // 24 hours in seconds

const getOptimization = async (queryLogId) => {
  const redis = getRedisClient();
  const cacheKey = `opt:${queryLogId}`;

  // Check Redis cache first
  const cachedResult = await redis.get(cacheKey);
  if (cachedResult) {
    return JSON.parse(cachedResult);
  }

  // Cache miss - fetch from DB and optimize
  const queryLog = await prisma.queryLog.findUnique({
    where: { id: queryLogId },
    include: { connection: true }
  });

  if (!queryLog) {
    throw new Error('Query log not found');
  }

  // If already optimized, use that
  if (queryLog.optimizedQuery && queryLog.explanation) {
    const result = {
      optimizedQuery: queryLog.optimizedQuery,
      explanation: queryLog.explanation
    };
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  }

  let schemaMetadata = null;
  if (queryLog.connection) {
    const schemaResult = await getSchemaMetadata(queryLog.connection);
    if (schemaResult.success) {
      schemaMetadata = schemaResult.schema;
    }
  }

  // Need to optimize
  const optimization = await optimizeSQL(queryLog.originalQuery, queryLog.explainPlan, schemaMetadata);

  // Save to DB
  const updatedQueryLog = await prisma.queryLog.update({
    where: { id: queryLogId },
    data: {
      optimizedQuery: optimization.optimizedQuery,
      explanation: optimization.explanation
    }
  });

  // Cache result
  const result = {
    optimizedQuery: optimization.optimizedQuery,
    explanation: optimization.explanation
  };
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

  return result;
};

module.exports = {
  getOptimization
};
