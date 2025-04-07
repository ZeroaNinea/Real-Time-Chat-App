import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  DIALECT: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  NODE_ENV: string;
  PORT: number;
}

export const getEnv = (): EnvConfig => {
  return {
    DIALECT: process.env.DIALECT || 'mongodb',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '27017', 10),
    DB_NAME: process.env.DB_NAME || 'default_db',
    DB_USER: process.env.DB_USER || '',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
  };
};

export const buildMongoUrl = (env = getEnv()): string => {
  const { DIALECT, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = env;
  return `${DIALECT}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
};
