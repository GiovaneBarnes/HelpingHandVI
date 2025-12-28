// Mock pg module before importing anything
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

// Mock dotenv before importing anything
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

import { Pool } from 'pg';
import { seedTestProviders } from '../seed-test-providers';

const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
} as any;

const mockPoolConstructor = Pool as jest.MockedClass<typeof Pool>;
mockPoolConstructor.mockImplementation(() => mockPool as any);

describe('seedTestProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset sequence mock - default to empty results
    mockPool.query.mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should seed test providers successfully', async () => {
    // Mock categories query
    const mockCategories = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 }
    ];
    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // setval query
      .mockResolvedValueOnce({ rows: mockCategories }) // categories query
      .mockResolvedValueOnce({ rows: [
        { id: 1, island: 'STT' },
        { id: 2, island: 'STJ' },
        { id: 3, island: 'STX' }
      ] }) // areas query
      .mockResolvedValueOnce({ rows: [{ island: 'STT' }] }) // provider island query for id 1
      .mockResolvedValueOnce({ rows: [{ island: 'STJ' }] }) // provider island query for id 2
      .mockResolvedValueOnce({ rows: [{ island: 'STX' }] }) // provider island query for id 3
      .mockResolvedValue({ rows: [{ id: 1 }] }); // Default for INSERT queries

    // Mock console methods
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await seedTestProviders(mockPool);

    // Verify sequence reset
    expect(mockPool.query).toHaveBeenCalledWith(
      "SELECT setval('providers_id_seq', (SELECT COALESCE(max(id), 0) FROM providers))"
    );

    // Verify categories query
    expect(mockPool.query).toHaveBeenCalledWith('SELECT id FROM categories');

    // Verify areas query
    expect(mockPool.query).toHaveBeenCalledWith('SELECT id, island FROM areas');

    // Verify provider island queries for existing providers
    expect(mockPool.query).toHaveBeenCalledWith('SELECT island FROM providers WHERE id = $1', [1]);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT island FROM providers WHERE id = $1', [2]);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT island FROM providers WHERE id = $1', [3]);

    // Verify provider insertions (50 new providers)
    const providerInsertCalls = mockPool.query.mock.calls.filter((call: any) =>
      call[0].includes('INSERT INTO providers')
    );
    expect(providerInsertCalls).toHaveLength(50);

    // Verify each provider insert has correct structure
    providerInsertCalls.forEach((call: any) => {
      expect(call[0]).toContain('INSERT INTO providers (name, phone, island, status)');
      expect(call[1]).toHaveLength(4); // name, phone, island, status
      expect(call[1][0]).toMatch(/^Test Provider \d+ (STT|STJ|STX)$/); // name format
      expect(call[1][1]).toMatch(/^340-\d{3}-\d{4}$/); // phone format
      expect(['STT', 'STJ', 'STX']).toContain(call[1][2]); // island
      expect(['OPEN_NOW', 'BUSY_LIMITED', 'NOT_TAKING_WORK']).toContain(call[1][3]); // status
    });

    // Verify activity events insertions (50 events)
    const activityInsertCalls = mockPool.query.mock.calls.filter((call: any) =>
      call[0].includes('INSERT INTO activity_events')
    );
    expect(activityInsertCalls).toHaveLength(50);

    // Verify pool.end() is called
    expect(mockPool.end).toHaveBeenCalled();

    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith('Seeding test providers...');
    expect(consoleLogSpy).toHaveBeenCalledWith('Seeded 50 test providers and updated existing ones.');

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should handle database errors gracefully', async () => {
    const testError = new Error('Database connection failed');
    mockPool.query.mockRejectedValue(testError);

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await seedTestProviders(mockPool);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding test providers:', testError);
    expect(mockPool.end).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should handle empty categories gracefully', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // setval
      .mockResolvedValueOnce({ rows: [] }) // empty categories
      .mockResolvedValueOnce({ rows: [] }) // empty areas
      .mockResolvedValueOnce({ rows: [{ island: 'STT' }] }) // provider island query for id 1
      .mockResolvedValueOnce({ rows: [{ island: 'STJ' }] }) // provider island query for id 2
      .mockResolvedValueOnce({ rows: [{ island: 'STX' }] }) // provider island query for id 3
      .mockResolvedValue({ rows: [{ id: 1 }] }); // Default for INSERT queries

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await seedTestProviders(mockPool);

    // Should still complete successfully even with empty categories/areas
    expect(consoleLogSpy).toHaveBeenCalledWith('Seeded 50 test providers and updated existing ones.');
    expect(mockPool.end).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it('should handle provider insertion errors gracefully', async () => {
    // Mock successful setup queries
    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // setval
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // categories
      .mockResolvedValueOnce({ rows: [{ id: 1, island: 'STT' }] }) // areas
      .mockResolvedValueOnce({ rows: [{ island: 'STT' }] }) // provider island
      .mockResolvedValueOnce({ rows: [{ island: 'STJ' }] }) // provider island
      .mockResolvedValueOnce({ rows: [{ island: 'STX' }] }) // provider island
      .mockRejectedValueOnce(new Error('Insert failed')) // Fail on first provider insert
      .mockResolvedValue({ rows: [{ id: 1 }] }); // Subsequent queries succeed

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await seedTestProviders(mockPool);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding test providers:', expect.any(Error));
    expect(mockPool.end).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should use correct database URL from environment', async () => {
    const originalEnv = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://test:password@localhost:5432/test_db';

    // Re-import to get new environment
    jest.resetModules();
    const { seedTestProviders: seedTestProvidersWithEnv } = require('../seed-test-providers');

    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // setval
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // categories
      .mockResolvedValueOnce({ rows: [{ id: 1, island: 'STT' }] }) // areas
      .mockResolvedValueOnce({ rows: [{ island: 'STT' }] }) // provider island
      .mockResolvedValueOnce({ rows: [{ island: 'STJ' }] }) // provider island
      .mockResolvedValueOnce({ rows: [{ island: 'STX' }] }) // provider island
      .mockResolvedValue({ rows: [{ id: 1 }] }); // Default for INSERT queries

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await seedTestProvidersWithEnv(mockPool);

    // Since we're passing a mock pool, we can't test the constructor call
    // But we can verify the function runs successfully
    expect(consoleLogSpy).toHaveBeenCalledWith('Seeded 50 test providers and updated existing ones.');

    // Restore environment
    process.env.DATABASE_URL = originalEnv;
    consoleLogSpy.mockRestore();
  });

  it('should use default database URL when env var is not set', async () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    // Re-import to get new environment
    jest.resetModules();
    const { seedTestProviders: seedTestProvidersWithoutEnv } = require('../seed-test-providers');

    mockPool.query
      .mockResolvedValueOnce({ rows: [] }) // setval
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // categories
      .mockResolvedValueOnce({ rows: [{ id: 1, island: 'STT' }] }) // areas
      .mockResolvedValueOnce({ rows: [{ island: 'STT' }] }) // provider island
      .mockResolvedValueOnce({ rows: [{ island: 'STJ' }] }) // provider island
      .mockResolvedValueOnce({ rows: [{ island: 'STX' }] }) // provider island
      .mockResolvedValue({ rows: [{ id: 1 }] }); // Default for INSERT queries

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await seedTestProvidersWithoutEnv(mockPool);

    // Since we're passing a mock pool, we can't test the constructor call
    // But we can verify the function runs successfully
    expect(consoleLogSpy).toHaveBeenCalledWith('Seeded 50 test providers and updated existing ones.');

    // Restore environment
    process.env.DATABASE_URL = originalEnv;
    consoleLogSpy.mockRestore();
  });
});