import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'resilifin',
  waitForConnections: true,
  connectionLimit: 10,
});

// Demo data DB: PAN-based dataset (separate database)
export const demoPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DEMO_DB_NAME || 'demo_data',
  waitForConnections: true,
  connectionLimit: 5,
});

