import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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