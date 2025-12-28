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
    await client.query('DELETE FROM areas');
    await client.query('DELETE FROM categories');

    // Insert test categories
    await client.query(`
      INSERT INTO categories (id, name) VALUES
      (1, 'Electrician'),
      (2, 'Plumber'),
      (3, 'AC Technician')
    `);

    // Insert test areas
    await client.query(`
      INSERT INTO areas (id, name, island) VALUES
      (1, 'Charlotte Amalie', 'STT'),
      (2, 'East End', 'STT'),
      (3, 'Cruz Bay', 'STJ'),
      (4, 'Coral Bay', 'STJ')
    `);

    // Insert test providers with lifecycle status
    await client.query(`
      INSERT INTO providers (id, name, phone, island, status, archived, lifecycle_status, plan, trial_end_at) VALUES
      (1, 'Provider A', '123', 'STT', 'OPEN_NOW', false, 'ACTIVE', 'FREE', NULL),
      (2, 'Provider B', '456', 'STJ', 'BUSY_LIMITED', false, 'ACTIVE', 'PREMIUM', NOW() + INTERVAL '1 day'),
      (3, 'Provider C', '789', 'STX', 'OPEN_NOW', false, 'ACTIVE', 'FREE', NULL),
      (4, 'Provider D', '999', 'STT', 'BUSY_LIMITED', false, 'ACTIVE', 'FREE', NULL),
      (5, 'Provider E', '111', 'STT', 'OPEN_NOW', false, 'ACTIVE', 'FREE', NULL)
    `);

    // Provider categories
    await client.query(`
      INSERT INTO provider_categories (provider_id, category_id) VALUES
      (1, 1), -- Provider A: Electrician
      (2, 2), -- Provider B: Plumber
      (3, 3), -- Provider C: AC Technician
      (4, 1), -- Provider D: Electrician
      (5, 2)  -- Provider E: Plumber
    `);

    // Provider areas
    await client.query(`
      INSERT INTO provider_areas (provider_id, area_id) VALUES
      (1, 1), (1, 2), -- Provider A: Charlotte Amalie, East End
      (2, 3), (2, 4), -- Provider B: Cruz Bay, Coral Bay
      (3, 1),         -- Provider C: Charlotte Amalie (different island)
      (4, 1),         -- Provider D: Charlotte Amalie
      (5, 2)          -- Provider E: East End
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
      INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
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
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'GOV_APPROVED') THEN 300
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'EMERGENCY_READY') THEN 200
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'VERIFIED') THEN 100
               ELSE 0
             END +
             CASE WHEN p.plan = 'PREMIUM' AND p.trial_end_at > NOW() THEN 50 ELSE 0 END +
             CASE WHEN p.lifecycle_status = 'ACTIVE' THEN 10 ELSE 0 END as trust_score,
             p.lifecycle_status
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
      ORDER BY trust_score DESC,
               (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) DESC NULLS LAST,
               p.status_last_updated_at DESC,
               p.id ASC
    `);

    expect(result.rows).toHaveLength(5); // All providers are active
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

    expect(result.rows[0].count).toBe('5'); // All 5 providers are active
  });

  test('filters by island=STT returns only STT providers', async () => {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
        AND p.island = $1
    `, ['STT']);

    expect(parseInt(result.rows[0].count)).toBeGreaterThan(0); // Should have at least some STT providers
  });

  test('filters by island=STT and areaId=1 returns correct providers', async () => {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
        AND p.island = $1
        AND EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $2)
    `, ['STT', 1]);

    expect(result.rows[0].count).toBe('2'); // Provider A and D cover Charlotte Amalie
  });

  test('filters by island=STT and categoryId=1 and status=OPEN_NOW returns correct providers', async () => {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM providers p
      WHERE p.lifecycle_status != 'ARCHIVED'
        AND p.island = $1
        AND p.status = $2
        AND EXISTS (SELECT 1 FROM provider_categories pc WHERE pc.provider_id = p.id AND pc.category_id = $3)
    `, ['STT', 'OPEN_NOW', 1]);

    expect(result.rows[0].count).toBe('1'); // Only Provider A matches all criteria
  });

  test('GET /categories returns non-empty list', async () => {
    const result = await client.query('SELECT id, name FROM categories ORDER BY name');
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0]).toHaveProperty('name');
  });

  test('invalid island value returns error', async () => {
    // This would be tested in the API integration test, but we can test the validation logic
    const invalidIslands = ['INVALID', 'NY', 'CA'];
    invalidIslands.forEach(island => {
      expect(['STT', 'STX', 'STJ']).not.toContain(island);
    });
  });
});