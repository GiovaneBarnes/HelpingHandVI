const { readFileSync } = require('fs');
const { join } = require('path');
const pg = require('pg');

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...');

    // Get all migration files
    const migrationsDir = join(process.cwd(), 'database', 'migrations');
    const fs = require('fs');

    // Read migration files in order
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf8');

      try {
        await client.query(sql);
        console.log(`✓ ${file} completed successfully`);
      } catch (error) {
        // Check if it's an "already exists" error, which we can ignore
        if (error.code === '42701' || error.code === '42P07' || error.message.includes('already exists')) {
          console.log(`⚠ ${file} skipped (already applied)`);
        } else {
          console.error(`✗ ${file} failed:`, error.message);
          // Continue with other migrations
        }
      }
    }

    console.log('Migrations completed!');
  } catch (error) {
    console.error('Migration runner failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();