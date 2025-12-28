import { Pool } from 'pg';
import dotenv from 'dotenv';
import { VerificationService } from '../server';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/virgin_islands_providers'
});

describe('Behavior-Based Verification System', () => {
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
    await client.query('DELETE FROM provider_categories');
    await client.query('DELETE FROM provider_areas');
    await client.query('DELETE FROM providers');
    await client.query('DELETE FROM areas');
    await client.query('DELETE FROM categories');

    // Insert test categories and areas
    await client.query(`
      INSERT INTO categories (id, name) VALUES
      (100, 'Test Category')
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO areas (id, name, island) VALUES
      (100, 'Test Area', 'STT')
      ON CONFLICT (id) DO NOTHING
    `);

    // Reset mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Verification Criteria Checking', () => {
    test('should not verify provider that is too new', async () => {
      // Create a provider that's only 7 days old
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (100, 'New Provider', '123-456-7890', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '7 days', '{"description": "Test description"}')
      `);

      // Add required profile data
      await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES (100, 100)');
      await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES (100, 100)');

      const isVerified = await VerificationService.checkVerificationCriteria(100);
      expect(isVerified).toBe(false);
    });

    test('should not verify provider without enough activity days', async () => {
      // Create a provider that's 20 days old but only active 3 days
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (101, 'Low Activity Provider', '123-456-7891', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '20 days', '{"description": "Test description"}')
      `);

      // Add required profile data
      await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES (101, 100)');
      await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES (101, 100)');

      // Add only 3 days of activity
      await client.query(`
        INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
        (101, 'PROFILE_UPDATED', NOW() - INTERVAL '1 day'),
        (101, 'STATUS_UPDATED', NOW() - INTERVAL '3 days'),
        (101, 'PROFILE_UPDATED', NOW() - INTERVAL '5 days')
      `);

      const isVerified = await VerificationService.checkVerificationCriteria(101);
      expect(isVerified).toBe(false);
    });

    test('should not verify provider without customer interaction', async () => {
      // Create a provider that's 20 days old with 5+ activity days but no customer interaction
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (102, 'No Interaction Provider', '123-456-7892', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '20 days', '{"description": "Test description"}')
      `);

      // Add required profile data
      await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES (102, 100)');
      await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES (102, 100)');

      // Add 5+ days of activity but no customer interactions
      await client.query(`
        INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
        (102, 'PROFILE_UPDATED', NOW() - INTERVAL '1 day'),
        (102, 'STATUS_UPDATED', NOW() - INTERVAL '2 days'),
        (102, 'PROFILE_UPDATED', NOW() - INTERVAL '3 days'),
        (102, 'PROFILE_UPDATED', NOW() - INTERVAL '4 days'),
        (102, 'STATUS_UPDATED', NOW() - INTERVAL '5 days'),
        (102, 'PROFILE_UPDATED', NOW() - INTERVAL '6 days')
      `);

      const isVerified = await VerificationService.checkVerificationCriteria(102);
      expect(isVerified).toBe(false);
    });

    test('should verify provider with all criteria met', async () => {
      // Create a provider that meets all criteria
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (103, 'Verified Provider', '123-456-7893', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '20 days', '{"description": "Test description"}')
      `);

      // Add required profile data
      await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES (103, 100)');
      await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES (103, 100)');

      // Add 5+ days of activity
      await client.query(`
        INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
        (103, 'PROFILE_UPDATED', NOW() - INTERVAL '1 day'),
        (103, 'STATUS_UPDATED', NOW() - INTERVAL '2 days'),
        (103, 'PROFILE_UPDATED', NOW() - INTERVAL '3 days'),
        (103, 'PROFILE_UPDATED', NOW() - INTERVAL '4 days'),
        (103, 'STATUS_UPDATED', NOW() - INTERVAL '5 days'),
        (103, 'PROFILE_UPDATED', NOW() - INTERVAL '6 days'),
        (103, 'CUSTOMER_CALL', NOW() - INTERVAL '7 days')
      `);

      const isVerified = await VerificationService.checkVerificationCriteria(103, client);
      expect(isVerified).toBe(true);
    });

    test('should verify provider with STATUS_OPEN_FOR_WORK instead of customer interaction', async () => {
      // Create a provider that meets all criteria using STATUS_OPEN_FOR_WORK
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (104, 'Open Provider', '123-456-7894', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '20 days', '{"description": "Test description"}')
      `);

      // Add required profile data
      await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES (104, 100)');
      await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES (104, 100)');

      // Add 5+ days of activity including STATUS_OPEN_FOR_WORK
      await client.query(`
        INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
        (104, 'PROFILE_UPDATED', NOW() - INTERVAL '1 day'),
        (104, 'STATUS_UPDATED', NOW() - INTERVAL '2 days'),
        (104, 'PROFILE_UPDATED', NOW() - INTERVAL '3 days'),
        (104, 'PROFILE_UPDATED', NOW() - INTERVAL '4 days'),
        (104, 'STATUS_UPDATED', NOW() - INTERVAL '5 days'),
        (104, 'STATUS_OPEN_FOR_WORK', NOW() - INTERVAL '6 days')
      `);

      const isVerified = await VerificationService.checkVerificationCriteria(104, client);
      expect(isVerified).toBe(true);
    });
  });

  describe('Badge Management', () => {
    test('should add VERIFIED badge when criteria are met', async () => {
      // Create a provider that meets all criteria
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (105, 'Badge Test Provider', '123-456-7895', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '20 days', '{"description": "Test description"}')
      `);

      // Add required profile data
      await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES (105, 100)');
      await client.query('INSERT INTO provider_areas (provider_id, area_id) VALUES (105, 100)');

      // Add activity
      await client.query(`
        INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
        (105, 'PROFILE_UPDATED', NOW() - INTERVAL '1 day'),
        (105, 'STATUS_UPDATED', NOW() - INTERVAL '2 days'),
        (105, 'PROFILE_UPDATED', NOW() - INTERVAL '3 days'),
        (105, 'PROFILE_UPDATED', NOW() - INTERVAL '4 days'),
        (105, 'STATUS_UPDATED', NOW() - INTERVAL '5 days'),
        (105, 'CUSTOMER_CALL', NOW() - INTERVAL '6 days')
      `);

      // Initially no VERIFIED badge
      const initialBadges = await client.query('SELECT * FROM provider_badges WHERE provider_id = 105 AND badge = \'VERIFIED\'');
      expect(initialBadges.rows.length).toBe(0);

      // Update verification status
      await VerificationService.updateVerificationStatus(105, client);

      // Should now have VERIFIED badge
      const finalBadges = await client.query('SELECT * FROM provider_badges WHERE provider_id = 105 AND badge = \'VERIFIED\'');
      expect(finalBadges.rows.length).toBe(1);
    });

    test('should remove VERIFIED badge when criteria are no longer met', async () => {
      // Create a provider and manually add VERIFIED badge
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (106, 'Badge Removal Test', '123-456-7896', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '5 days', '{"description": "Test description"}')
      `);

      // Add VERIFIED badge manually
      await client.query('INSERT INTO provider_badges (provider_id, badge) VALUES (106, \'VERIFIED\')');

      // Add minimal profile data (missing some requirements)
      await client.query('INSERT INTO provider_categories (provider_id, category_id) VALUES (106, 100)');
      // Missing area - should fail verification

      // Update verification status
      await VerificationService.updateVerificationStatus(106, client);

      // Should have removed VERIFIED badge
      const finalBadges = await client.query('SELECT * FROM provider_badges WHERE provider_id = 106 AND badge = \'VERIFIED\'');
      expect(finalBadges.rows.length).toBe(0);
    });
  });

  describe('Decay Rule', () => {
    test('should remove VERIFIED badge from inactive providers', async () => {
      // Create a provider and add VERIFIED badge
      await client.query(`
        INSERT INTO providers (id, name, phone, island, status, lifecycle_status, plan, created_at, profile) VALUES
        (107, 'Inactive Provider', '123-456-7897', 'STT', 'OPEN_NOW', 'ACTIVE', 'FREE', NOW() - INTERVAL '60 days', '{"description": "Test description"}')
      `);

      // Add VERIFIED badge
      await client.query('INSERT INTO provider_badges (provider_id, badge) VALUES (107, \'VERIFIED\')');

      // Add old activity (more than 30 days ago)
      await client.query(`
        INSERT INTO activity_events (provider_id, event_type, created_at) VALUES
        (107, 'PROFILE_UPDATED', NOW() - INTERVAL '35 days'),
        (107, 'STATUS_UPDATED', NOW() - INTERVAL '40 days')
      `);

      // Run the decay check
      await VerificationService.checkAndUpdateAllProviders(client);

      // Should have removed VERIFIED badge due to inactivity
      const finalBadges = await client.query('SELECT * FROM provider_badges WHERE provider_id = 107 AND badge = \'VERIFIED\'');
      expect(finalBadges.rows.length).toBe(0);
    });
  });
});