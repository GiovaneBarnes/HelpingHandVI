import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

describe('GET /providers', () => {
  let client: any;

  beforeAll(async () => {
    client = await pool.connect();
    await client.query('BEGIN');
  });

  afterAll(async () => {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up test data within the transaction
    await client.query('DELETE FROM activity_events');
    await client.query('DELETE FROM provider_badges');
    await client.query('DELETE FROM provider_areas');
    await client.query('DELETE FROM provider_categories');
    await client.query('DELETE FROM providers');

    // Insert test providers with lifecycle status
    await client.query(`
      INSERT INTO providers (id, name, phone, island, status, archived, lifecycle_status, plan, trial_end_at) VALUES
      (1, 'Provider A', '123', 'St. Thomas', 'TODAY', false, 'ACTIVE', 'FREE', NULL),
      (2, 'Provider B', '456', 'St. John', 'THIS_WEEK', false, 'ACTIVE', 'PREMIUM', NOW() + INTERVAL '1 day'),
      (3, 'Provider C', '789', 'St. Croix', 'TODAY', false, 'ACTIVE', 'FREE', NULL),
      (4, 'Provider D', '999', 'St. Thomas', 'TODAY', false, 'ARCHIVED', 'FREE', NULL)
    `);

    // Badges
    await client.query(`
      INSERT INTO provider_badges (provider_id, badge) VALUES
      (1, 'VERIFIED'),
      (2, 'EMERGENCY_READY'),
      (3, 'GOV_APPROVED')
    `);

    // Activity events
    await client.query(`
      INSERT INTO activity_events (provider_id, type, created_at) VALUES
      (1, 'PROFILE_UPDATED', '2023-12-25 10:00:00'),
      (2, 'STATUS_UPDATED', '2023-12-25 09:00:00'),
      (3, 'VERIFIED', '2023-12-25 08:00:00')
    `);
  });

  test('sorts by trust score: badges + plan + lifecycle', async () => {
    const result = await client.query(`
      SELECT p.*,
             (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at,
             CASE
               -- Verification badge weights (configurable)
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'GOV_APPROVED') THEN 300
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'EMERGENCY_READY') THEN 200
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'VERIFIED') THEN 100
               ELSE 0
             END +
             -- Plan weights
             CASE WHEN p.plan = 'PREMIUM' AND p.trial_end_at > NOW() THEN 50 ELSE 0 END +
             -- Lifecycle status weights (ACTIVE > INACTIVE)
             CASE WHEN p.lifecycle_status = 'ACTIVE' THEN 10 ELSE 0 END as trust_score,
             p.lifecycle_status
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
      ORDER BY trust_score DESC,
               (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) DESC NULLS LAST,
               p.status_last_updated_at DESC,
               p.id ASC
    `);

    expect(result.rows).toHaveLength(3); // Should exclude archived provider
    expect(result.rows[0].name).toBe('Provider C'); // GOV_APPROVED (300) + ACTIVE (10) = 310
    expect(result.rows[1].name).toBe('Provider B'); // EMERGENCY_READY (200) + PREMIUM (50) + ACTIVE (10) = 260
    expect(result.rows[2].name).toBe('Provider A'); // VERIFIED (100) + ACTIVE (10) = 110
  });

  test('excludes archived providers from results', async () => {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
    `);

    expect(result.rows[0].count).toBe('3');
  });
});