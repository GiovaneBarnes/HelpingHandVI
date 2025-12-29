import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PRODUCTION SAFETY CHECK
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: This script clears provider data and should NEVER be run in production!');
  console.error('This script is for development/testing only.');
  process.exit(1);
}

console.log('🟡 WARNING: This script will DELETE ALL providers from the database.');
console.log('Only run this in development/testing environments.');

async function clearProviders() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/virgin_islands_providers'
  });

  try {
    console.log('🧹 Clearing existing providers and related data...');

    // Clear in correct order due to foreign key constraints
    await pool.query('DELETE FROM provider_badges');
    await pool.query('DELETE FROM provider_categories');
    await pool.query('DELETE FROM provider_areas');
    await pool.query('DELETE FROM activity_events');
    await pool.query('DELETE FROM providers');

    console.log('✅ All providers and related data cleared successfully');

  } catch (error) {
    console.error('❌ Failed to clear providers:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

clearProviders().catch(console.error);