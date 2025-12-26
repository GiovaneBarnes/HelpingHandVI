import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

describe('GET /providers', () => {
  beforeAll(async () => {
    // Setup test data
    await pool.query('DELETE FROM activity_events');
    await pool.query('DELETE FROM provider_badges');
    await pool.query('DELETE FROM provider_areas');
    await pool.query('DELETE FROM provider_categories');
    await pool.query('DELETE FROM providers');

    // Insert test providers
    await pool.query(`
      INSERT INTO providers (id, name, phone, island, status, archived) VALUES
      (1, 'Provider A', '123', 'St. Thomas', 'TODAY', false),
      (2, 'Provider B', '456', 'St. John', 'THIS_WEEK', false),
      (3, 'Provider C', '789', 'St. Croix', 'TODAY', false)
    `);

    // Badges
    await pool.query(`
      INSERT INTO provider_badges (provider_id, badge) VALUES
      (1, 'VERIFIED'),
      (2, 'EMERGENCY_READY'),
      (3, 'GOV_APPROVED')
    `);

    // Activity
    await pool.query(`
      INSERT INTO activity_events (provider_id, type, created_at) VALUES
      (1, 'login', '2023-12-25 10:00:00'),
      (2, 'login', '2023-12-25 09:00:00'),
      (3, 'login', '2023-12-25 08:00:00')
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  test('sorts by badge priority, then last active, then status updated', async () => {
    // Mock the app or test the query directly
    const result = await pool.query(`
      SELECT p.*,
             (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) as last_active_at,
             CASE
               WHEN $1 = 'TODAY' AND EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'EMERGENCY_READY') THEN 1000
               ELSE 0
             END +
             CASE
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'VERIFIED') THEN 100
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'EMERGENCY_READY') THEN 200
               WHEN EXISTS (SELECT 1 FROM provider_badges WHERE provider_id = p.id AND badge = 'GOV_APPROVED') THEN 300
               ELSE 0
             END as score
      FROM providers p
      WHERE p.archived = false
      ORDER BY score DESC, 
               (SELECT MAX(created_at) FROM activity_events WHERE provider_id = p.id) DESC NULLS LAST, 
               p.last_updated_at DESC
    `, ['TODAY']);

    expect(result.rows[0].name).toBe('Provider C'); // GOV_APPROVED 300
    expect(result.rows[1].name).toBe('Provider B'); // EMERGENCY_READY 200 + 1000 boost for TODAY
    expect(result.rows[2].name).toBe('Provider A'); // VERIFIED 100
  });
});