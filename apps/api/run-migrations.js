import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

const migrations = [
  '001_create_enums.sql',
  '002_create_tables.sql',
  '003_create_indexes.sql',
  '004_add_archived_to_providers.sql',
  '005_add_plan_to_providers.sql',
  '006_create_reports_table.sql',
  '007_add_trust_system.sql',
  '008_add_trust_indexes.sql',
  '009_add_contact_preferences.sql',
  '010_add_admin_governance.sql',
  '011_add_plan_source.sql',
  '012_update_availability_status.sql',
  '013_add_authentication.sql'
];

const seeds = [
  '001_seed_categories.sql',
  '002_seed_areas.sql',
  '003_seed_providers.sql'
];

async function runMigrations() {
  for (const m of migrations) {
    try {
      const sql = fs.readFileSync(`/Users/giovanebarnes/dev/HelpingHand/database/migrations/${m}`, 'utf8');
      await pool.query(sql);
      console.log(`${m} OK`);
    } catch (e) {
      console.error(`Error in ${m}:`, e.message);
    }
  }
}

async function runSeeds() {
  for (const s of seeds) {
    try {
      const sql = fs.readFileSync(`/Users/giovanebarnes/dev/HelpingHand/database/seeds/${s}`, 'utf8');
      await pool.query(sql);
      console.log(`${s} OK`);
    } catch (e) {
      console.error(`Error in ${s}:`, e.message);
    }
  }
}

async function main() {
  await runMigrations();
  await runSeeds();
  await pool.end();
}

main();