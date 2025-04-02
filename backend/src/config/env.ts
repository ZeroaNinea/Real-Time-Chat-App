import dotenv from 'dotenv';
dotenv.config();

export const DIALECT: string = process.env.DIALECT!;
export const DB_HOST: string = process.env.DB_HOST!;
export const DB_PORT: number | string = parseInt(process.env.DB_PORT!);
export const DB_NAME: string = process.env.DB_NAME!;
export const DB_USER: string = process.env.DB_USER!;
export const DB_PASSWORD: string = process.env.DB_PASSWORD!;
export const DB_URL: string = `${DIALECT}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
