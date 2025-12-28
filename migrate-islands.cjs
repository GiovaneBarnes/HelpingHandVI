const { Pool } = require('pg');
require('dotenv').config();

async function migrateIslands() {
  const pool = new Pool();
  try {
    console.log('Starting island migration...');

    // Update providers table
    await pool.query(`
      UPDATE providers
      SET island = CASE
        WHEN island = 'St. Thomas' THEN 'STT'
        WHEN island = 'St. Croix' THEN 'STX'
        WHEN island = 'St. John' THEN 'STJ'
        ELSE island
      END
    `);

    // Update areas table
    await pool.query(`
      UPDATE areas
      SET island = CASE
        WHEN island = 'St. Thomas' THEN 'STT'
        WHEN island = 'St. Croix' THEN 'STX'
        WHEN island = 'St. John' THEN 'STJ'
        ELSE island
      END
    `);

    console.log('Island migration completed successfully');

    // Verify the changes
    const providersResult = await pool.query('SELECT DISTINCT island FROM providers ORDER BY island');
    console.log('Updated providers islands:', providersResult.rows);

    const areasResult = await pool.query('SELECT DISTINCT island FROM areas ORDER BY island');
    console.log('Updated areas islands:', areasResult.rows);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateIslands().catch(console.error);