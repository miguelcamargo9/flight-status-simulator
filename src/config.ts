import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  dbPath: process.env.DB_PATH || './data/flights.db',
  defaultTimeScale: parseInt(process.env.TIME_SCALE || '60', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};
