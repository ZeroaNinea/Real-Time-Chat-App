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
  DB_URL?: string;
}

export const getEnv = (): EnvConfig => {
  return {
    DIALECT: process.env.DIALECT ?? 'mongodb',
    DB_HOST: process.env.DB_HOST ?? 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT ?? '27017', 10),
    DB_NAME: process.env.DB_NAME ?? 'default_db',
    DB_USER: process.env.DB_USER ?? '',
    DB_PASSWORD: process.env.DB_PASSWORD ?? '',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: parseInt(process.env.PORT ?? '3000', 10),
    DB_URL: process.env.DB_URL ?? undefined,
  };
};

export function buildMongoUrl() {
  const env = getEnv();
  return (
    env.DB_URL ??
    `mongodb://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?authSource=admin`
  );
}
