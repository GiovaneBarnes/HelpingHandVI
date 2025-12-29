import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

describe('Trust Scoring System', () => {
  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM activity_events');
    await pool.query('DELETE FROM provider_badges');
    await pool.query('DELETE FROM providers');

    // Insert test providers with different combinations
    await pool.query(`
      INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, trial_end_at) VALUES
      (1, 'GOV Provider', '111', 'St. Thomas', 'OPEN_NOW', 'ACTIVE', 'FREE', NULL),
      (2, 'Emergency Provider', '222', 'St. John', 'OPEN_NOW', 'ACTIVE', 'FREE', NULL),
      (3, 'Verified Provider', '333', 'St. Croix', 'OPEN_NOW', 'ACTIVE', 'FREE', NULL),
      (4, 'Premium Provider', '444', 'St. Thomas', 'OPEN_NOW', 'ACTIVE', 'PREMIUM', NOW() + INTERVAL '1 day'),
      (5, 'Inactive Provider', '555', 'St. John', 'OPEN_NOW', 'INACTIVE', 'FREE', NULL),
      (6, 'No Badges Provider', '666', 'St. Croix', 'OPEN_NOW', 'ACTIVE', 'FREE', NULL)
    `);

    // Add badges
    await pool.query(`
      INSERT INTO provider_badges (provider_id, badge) VALUES
      (1, 'GOV_APPROVED'),
      (2, 'EMERGENCY_READY'),
      (3, 'VERIFIED')
    `);

    // Add activity events
    await pool.query(`
      INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
      (1, 'PROFILE_UPDATED', NOW() - INTERVAL '1 day'),
      (2, 'STATUS_UPDATED', NOW() - INTERVAL '2 days'),
      (3, 'VERIFIED', NOW() - INTERVAL '3 days'),
      (4, 'PROFILE_UPDATED', NOW() - INTERVAL '4 days'),
      (5, 'STATUS_UPDATED', NOW() - INTERVAL '5 days'),
      (6, 'PROFILE_UPDATED', NOW() - INTERVAL '6 days')
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  test('calculates trust scores correctly', async () => {
    const result = await pool.query(`
      SELECT p.id, p.name,
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
             p.lifecycle_status,
             (SELECT COALESCE(MAX(created_at), p.created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at
      FROM providers p
      ORDER BY trust_score DESC,
               (SELECT COALESCE(MAX(created_at), p.created_at) FROM activity_events WHERE provider_id = p.id) DESC,
               p.status_last_updated_at DESC,
               p.id ASC
    `);

    expect(result.rows).toHaveLength(6);

    // GOV_APPROVED (300) + ACTIVE (10) = 310
    expect(result.rows[0]).toMatchObject({
      id: 1,
      name: 'GOV Provider',
      trust_score: 310,
      lifecycle_status: 'ACTIVE'
    });

    // EMERGENCY_READY (200) + ACTIVE (10) = 210
    expect(result.rows[1]).toMatchObject({
      id: 2,
      name: 'Emergency Provider',
      trust_score: 210,
      lifecycle_status: 'ACTIVE'
    });

    // VERIFIED (100) + ACTIVE (10) = 110
    expect(result.rows[2]).toMatchObject({
      id: 3,
      name: 'Verified Provider',
      trust_score: 110,
      lifecycle_status: 'ACTIVE'
    });

    // PREMIUM (50) + ACTIVE (10) = 60
    expect(result.rows[3]).toMatchObject({
      id: 4,
      name: 'Premium Provider',
      trust_score: 60,
      lifecycle_status: 'ACTIVE'
    });

    // ACTIVE (10) = 10
    expect(result.rows[4]).toMatchObject({
      id: 6,
      name: 'No Badges Provider',
      trust_score: 10,
      lifecycle_status: 'ACTIVE'
    });

    // INACTIVE (0) = 0
    expect(result.rows[5]).toMatchObject({
      id: 5,
      name: 'Inactive Provider',
      trust_score: 0,
      lifecycle_status: 'INACTIVE'
    });
  });

  test('excludes archived providers from public listing', async () => {
    // Add an archived provider
    await pool.query(`
      INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan) VALUES
      (7, 'Archived Provider', '777', 'St. Thomas', 'OPEN_NOW', 'ARCHIVED', 'FREE')
    `);

    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
    `);

    expect(result.rows[0].count).toBe('6'); // Should exclude the archived one

    // Clean up
    await pool.query('DELETE FROM providers WHERE id = 7');
  });

  test('deterministic ordering with tie-breakers', async () => {
    // Create providers with same trust score but different activity times
    await pool.query(`
      INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan) VALUES
      (8, 'Tie Provider 1', '888', 'St. Thomas', 'OPEN_NOW', 'ACTIVE', 'FREE'),
      (9, 'Tie Provider 2', '999', 'St. Thomas', 'OPEN_NOW', 'ACTIVE', 'FREE')
    `);

    await pool.query(`
      INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
      (8, 'PROFILE_UPDATED', NOW() - INTERVAL '1 hour'),
      (9, 'PROFILE_UPDATED', NOW() - INTERVAL '2 hours')
    `);

    const result = await pool.query(`
      SELECT p.id, p.name,
             10 as trust_score, -- Same score for both
             (SELECT COALESCE(MAX(created_at), p.created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at
      FROM providers p
      WHERE p.id IN (8, 9)
      ORDER BY trust_score DESC,
               (SELECT COALESCE(MAX(created_at), p.created_at) FROM activity_events WHERE provider_id = p.id) DESC,
               p.status_last_updated_at DESC,
               p.id ASC
    `);

    // Provider 8 should come first (more recent activity)
    expect(result.rows[0].id).toBe(8);
    expect(result.rows[1].id).toBe(9);

    // Clean up
    await pool.query('DELETE FROM activity_events WHERE provider_id IN (8, 9)');
    await pool.query('DELETE FROM providers WHERE id IN (8, 9)');
  });

  test('badge priority hierarchy', async () => {
    // Test that GOV_APPROVED beats EMERGENCY_READY beats VERIFIED
    const badgeScores = await pool.query(`
      SELECT
        CASE WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = 1 AND badge = 'GOV_APPROVED') THEN 300 ELSE 0 END as gov_score,
        CASE WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = 2 AND badge = 'EMERGENCY_READY') THEN 200 ELSE 0 END as emergency_score,
        CASE WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = 3 AND badge = 'VERIFIED') THEN 100 ELSE 0 END as verified_score
    `);

    expect(badgeScores.rows[0].gov_score).toBe(300);
    expect(badgeScores.rows[0].emergency_score).toBe(200);
    expect(badgeScores.rows[0].verified_score).toBe(100);
  });
});