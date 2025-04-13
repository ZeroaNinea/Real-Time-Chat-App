import dotenv from 'dotenv';
dotenv.config();

export type NodeEnv = 'development' | 'test' | 'production';

export interface EnvConfig {
  DIALECT: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  NODE_ENV: NodeEnv;
  PORT: number;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
}

const config: EnvConfig = {
  DIALECT: process.env.DIALECT || 'mongodb',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT || 27017),
  DB_NAME: process.env.DB_NAME || 'default_db',
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  NODE_ENV: (process.env.NODE_ENV || 'development') as NodeEnv,
  PORT: Number(process.env.PORT || 3000),
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
};

export default config;
