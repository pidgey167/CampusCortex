const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔴 Redis Connected');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    console.log('⚠️  Redis not available, using fallback');
    // Return a mock Redis client for basic functionality
    return {
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
      del: async () => 1,
      incr: async () => 1
    };
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
