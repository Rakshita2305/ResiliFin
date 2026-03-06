import dotenv from 'dotenv';

dotenv.config();

const required = [
  'MONGO_URI',
  'MONGO_DB_NAME',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI as string,
  mongoDbName: process.env.MONGO_DB_NAME as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
};
