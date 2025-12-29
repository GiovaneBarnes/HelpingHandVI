import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PRODUCTION WARNING - This script only reads data, but use caution
if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: Running diagnostic scripts in production. This script only reads data.');
}

async function checkIslands() {
  const pool = new Pool();
  try {
    const result = await pool.query('SELECT DISTINCT island FROM providers');
    console.log('Current island values:', result.rows);

    const areasResult = await pool.query('SELECT DISTINCT island FROM areas');
    console.log('Areas island values:', areasResult.rows);
  } finally {
    await pool.end();
  }
}

checkIslands().catch(console.error);