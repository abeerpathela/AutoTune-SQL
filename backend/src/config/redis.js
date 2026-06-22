const Redis = require('ioredis');
const { REDIS_URL } = require('./env');
const logger = require('./logger');

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL);

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err.message);
    });
  }

  return redisClient;
}

module.exports = getRedisClient;
