import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PRODUCTION SAFETY CHECK
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: This script modifies database schema and should NEVER be run in production!');
  console.error('This script is for development/testing only.');
  process.exit(1);
}

async function addBeautyServicesCategory() {
  const pool = new Pool();
  try {
    console.log('Adding Beauty Services category...');

    // Check if category already exists
    const existing = await pool.query('SELECT id FROM categories WHERE name = $1', ['Beauty Services']);

    if (existing.rows.length > 0) {
      console.log('Beauty Services category already exists');
      return;
    }

    // Add the category
    await pool.query('INSERT INTO categories (name) VALUES ($1)', ['Beauty Services']);

    console.log('Beauty Services category added successfully');

  } catch (error) {
    console.error('Failed to add Beauty Services category:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addBeautyServicesCategory().catch(console.error);