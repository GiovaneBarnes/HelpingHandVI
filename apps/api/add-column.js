import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgrespass123',
  database: 'virgin_islands_providers'
});

async function addStatusColumn() {
  try {
    console.log('Granting permissions to tempuser...');

    await pool.query(`GRANT ALL PRIVILEGES ON DATABASE virgin_islands_providers TO tempuser;`);
    await pool.query(`GRANT ALL PRIVILEGES ON TABLE providers TO tempuser;`);

    console.log('Checking for status_last_updated_at column...');

    const columnCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'providers' AND column_name = 'status_last_updated_at'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('Adding status_last_updated_at column...');
      await pool.query(`
        ALTER TABLE providers ADD COLUMN status_last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
      `);
      console.log('Column added successfully');
    } else {
      console.log('Column already exists');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

addStatusColumn();