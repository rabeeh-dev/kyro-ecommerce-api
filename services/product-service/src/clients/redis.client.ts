import { createClient } from 'redis';

// Initialize the client using the Docker environment variable
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err: Error) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Connected to Redis Cache'));

export const connectRedis = async () => {
  await redisClient.connect();
};