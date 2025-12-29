import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PRODUCTION SAFETY CHECK
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: This script modifies database schema and should NEVER be run in production!');
  console.error('This script is for development/testing only.');
  process.exit(1);
}

async function addBeautyServicesCategory() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/virgin_islands_providers'
  });

  try {
    console.log('Connecting to database...');

    // Check if category already exists
    const existing = await pool.query('SELECT id FROM categories WHERE name = $1', ['Beauty Services']);

    if (existing.rows.length > 0) {
      console.log('✅ Beauty Services category already exists (ID:', existing.rows[0].id, ')');
      return;
    }

    // Add the category
    const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', ['Beauty Services']);

    console.log('✅ Beauty Services category added successfully with ID:', result.rows[0].id);

  } catch (error) {
    console.error('❌ Failed to add Beauty Services category:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addBeautyServicesCategory().catch(console.error);