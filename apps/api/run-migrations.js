import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const { Pool } = pg;

// Resolve repo root relative to this file (apps/api/run-migrations.js -> repo root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", ".."); // apps/api -> repo root

const MIGRATIONS_DIR = path.join(repoRoot, "database", "migrations");
const SEEDS_DIR = path.join(repoRoot, "database", "seeds");

const connectionString =
  process.env.DATABASE_URL_CLOUDSQL ||
  process.env.DATABASE_URL ||
  "postgresql://localhost:5432/virgin_islands_providers";

const pool = new Pool({ connectionString });

const migrations = [
  "001_create_enums.sql",
  "002_create_tables.sql",
  "003_create_indexes.sql",
  "004_add_archived_to_providers.sql",
  "005_add_plan_to_providers.sql",
  "006_create_reports_table.sql",
  "007_add_trust_system.sql",
  "008_add_trust_indexes.sql",
  "009_add_contact_preferences.sql",
  "010_add_admin_governance.sql",
  "011_add_plan_source.sql",
  "012_update_availability_status.sql",
  "013_add_authentication.sql",
  "014_add_report_status.sql",
  "015_add_change_requests.sql",
  "016_add_change_request_audit.sql",
  "017_add_contact_preference.sql",
  "018_add_firebase_uid.sql",
  "019_fix_availability_enum.sql",
  "020_add_neighborhood_to_areas.sql",
  "021_add_description_to_providers.sql",
  "022_add_updated_at_to_providers.sql",
  "023_extend_activity_event_type_enum.sql",
  "024_unique_provider_categories.sql",
  "025_extend_activity_event_type_enum_customer.sql",
  "026_unique_pending_change_request.sql",
  "027_add_admin_status.sql"
];

const seeds = ["001_seed_categories.sql", "002_seed_areas.sql", "003_seed_providers.sql"];

async function runSqlFiles(dir, files) {
  for (const f of files) {
    const filePath = path.join(dir, f);
    try {
      const sql = fs.readFileSync(filePath, "utf8");
      await pool.query(sql);
      console.log(`${f} OK`);
    } catch (e) {
      console.error(`Error in ${f}:`, e.message);
    }
  }
}

async function main() {
  console.log("Using DB:", connectionString.includes("cloudsql") ? "Cloud SQL (socket)" : connectionString);

  await runSqlFiles(MIGRATIONS_DIR, migrations);
  await runSqlFiles(SEEDS_DIR, seeds);

  await pool.end();
}

main().catch(async (e) => {
  console.error("Fatal:", e);
  await pool.end();
  process.exit(1);
});
