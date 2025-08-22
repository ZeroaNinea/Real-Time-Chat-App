// import * as ioredis from 'ioredis';
import redisHelper from '../helpers/redis-helper';
import config from './env';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, UPSTASH_REDIS_URL } = config;

// const redisConfig = {
//   host: REDIS_HOST,
//   port: REDIS_PORT,
//   password: REDIS_PASSWORD,
//   db: 0,
// };

const redis = new redisHelper.Redis(UPSTASH_REDIS_URL);
const redisClient = redis.duplicate();

redisClient.on('error', (err) => {
  console.error(' ❌ ', err);
});

export { redis, redisClient };
