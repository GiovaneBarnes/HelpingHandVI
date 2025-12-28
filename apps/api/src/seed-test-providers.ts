import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

export async function seedTestProviders(testPool?: typeof pool) {
  const dbPool = testPool || pool;
  try {
    console.log('Seeding test providers...');

    // Reset sequence to avoid conflicts
    await dbPool.query("SELECT setval('providers_id_seq', (SELECT COALESCE(max(id), 0) FROM providers))");

    // Get all categories
    const categoriesRes = await dbPool.query('SELECT id FROM categories');
    const categoryIds = categoriesRes.rows.map((r: any) => r.id);

    // Get areas grouped by island
    const areasRes = await dbPool.query('SELECT id, island FROM areas');
    const areasByIsland: { [key: string]: number[] } = {};
    areasRes.rows.forEach((row: any) => {
      if (!areasByIsland[row.island]) areasByIsland[row.island] = [];
      areasByIsland[row.island].push(row.id);
    });

    const islands = ['STT', 'STJ', 'STX'];
    const statuses: string[] = ['OPEN_NOW', 'BUSY_LIMITED', 'NOT_TAKING_WORK'];
    const badges: string[] = ['VERIFIED', 'EMERGENCY_READY', 'GOV_APPROVED'];

    // First, add more categories/areas to existing providers
    const existingProviders = [1, 2, 3];
    for (const providerId of existingProviders) {
      // Add random categories (up to 3 more)
      const numCats = Math.floor(Math.random() * 4);
      const catsToAdd = categoryIds.sort(() => 0.5 - Math.random()).slice(0, numCats);
      for (const catId of catsToAdd) {
        try {
          await dbPool.query('INSERT INTO provider_categories (provider_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [providerId, catId]);
        } catch (e) {}
      }

      // Get provider's island
      const provRes = await dbPool.query('SELECT island FROM providers WHERE id = $1', [providerId]);
      const island = provRes.rows[0].island;
      const availableAreas = areasByIsland[island] || [];
      const numAreas = Math.floor(Math.random() * 6);
      const areasToAdd = availableAreas.sort(() => 0.5 - Math.random()).slice(0, numAreas);
      for (const areaId of areasToAdd) {
        try {
          await dbPool.query('INSERT INTO provider_areas (provider_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [providerId, areaId]);
        } catch (e) {}
      }

      // Randomly add badges
      const numBadges = Math.floor(Math.random() * 3);
      const badgesToAdd = badges.sort(() => 0.5 - Math.random()).slice(0, numBadges);
      for (const badge of badgesToAdd) {
        await dbPool.query('INSERT INTO provider_badges (provider_id, badge, assigned_by, notes) VALUES ($1, $2, $3, $4)', [providerId, badge, 'test', 'Test badge']);
      }
    }

    // Now add 50 new providers
    for (let i = 0; i < 50; i++) {
      const island = islands[Math.floor(Math.random() * islands.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const name = `Test Provider ${i + 1} ${island}`;
      const phone = `340-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const insertRes = await dbPool.query(
        'INSERT INTO providers (name, phone, island, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, phone, island, status]
      );
      const providerId = insertRes.rows[0].id;

      // Assign categories (0-3, sometimes 0 for edge case)
      const numCats = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 4) + 1; // 10% chance of no categories
      const catsToAdd = categoryIds.sort(() => 0.5 - Math.random()).slice(0, numCats);
      for (const catId of catsToAdd) {
        await dbPool.query('INSERT INTO provider_categories (provider_id, category_id) VALUES ($1, $2)', [providerId, catId]);
      }

      // Assign areas (0-5, sometimes 0)
      const availableAreas = areasByIsland[island] || [];
      const numAreas = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 6) + 1; // 10% chance of no areas
      const areasToAdd = availableAreas.sort(() => 0.5 - Math.random()).slice(0, numAreas);
      for (const areaId of areasToAdd) {
        await dbPool.query('INSERT INTO provider_areas (provider_id, area_id) VALUES ($1, $2)', [providerId, areaId]);
      }

      // Assign badges (0-2)
      const numBadges = Math.floor(Math.random() * 3);
      const badgesToAdd = badges.sort(() => 0.5 - Math.random()).slice(0, numBadges);
      for (const badge of badgesToAdd) {
        await dbPool.query('INSERT INTO provider_badges (provider_id, badge, assigned_by, notes) VALUES ($1, $2, $3, $4)', [providerId, badge, 'test', 'Test badge']);
      }

      // Add activity event with varied timestamps
      const activityTypes = ['profile_created', 'profile_updated', 'service_completed'];
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      // Random time: 0 to 365 days ago
      const daysAgo = Math.floor(Math.random() * 366);
      const activityDate = new Date();
      activityDate.setDate(activityDate.getDate() - daysAgo);
      
      await dbPool.query('INSERT INTO activity_events (type, provider_id, created_at) VALUES ($1, $2, $3)', [randomType, providerId, activityDate.toISOString()]);
    }

    console.log('Seeded 50 test providers and updated existing ones.');
  } catch (error) {
    console.error('Error seeding test providers:', error);
  } finally {
    await dbPool.end();
  }
}

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  seedTestProviders();
}