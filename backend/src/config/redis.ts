import ioredis from 'ioredis';
import config from './env';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = config;

const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
};

const redis = new ioredis(redisConfig);
const redisClient = redis.duplicate();

redisClient.on('error', (err) => {
  console.error(err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

export { redis, redisClient };
