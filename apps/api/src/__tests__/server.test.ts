import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';
import { app } from '../server'; // Assuming we export app from server.ts

// Mock the pool
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(() => Promise.resolve(mockClient)),
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Set up test environment variables
process.env.ADMIN_KEY = 'test-admin-key';
process.env.NODE_ENV = 'test';

const mockPool = new Pool() as any;
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

describe('GET /providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated results with default limit', async () => {
    const mockProviders = [
      { id: 1, name: 'Provider 1', score: 100, last_active_at: '2023-01-01T00:00:00Z' },
      { id: 2, name: 'Provider 2', score: 90, last_active_at: '2023-01-01T00:00:00Z' },
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get('/providers');

    expect(response.status).toBe(200);
    expect(response.body.data.providers).toHaveLength(2);
    expect(response.body.data.nextCursor).toBeNull();
  });

  it('should clamp limit to max 50', async () => {
    const mockProviders = Array(51).fill({ id: 1, score: 100, last_active_at: null });
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get('/providers?limit=100');

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $'),
      expect.arrayContaining([51]) // limit +1
    );
  });

  it('should return 400 for invalid limit', async () => {
    // Mock the emergency mode query
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/providers?limit=0');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_LIMIT');
  });

  it('should handle cursor pagination', async () => {
    const cursor = Buffer.from(JSON.stringify({
      trust_tier: 2,
      is_premium_active: true,
      emergency_boost_eligible: 0,
      lifecycle_active: true,
      last_active_at: '2023-01-01T00:00:00Z',
      status_last_updated_at: '2023-01-01T00:00:00Z',
      id: 1
    })).toString('base64');
    const mockProviders = [{
      id: 2,
      name: 'Provider 2',
      phone: '123-456-7890',
      island: 'St. John',
      profile: {},
      status: 'AVAILABLE',
      last_updated_at: '2023-01-01T00:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
      plan: 'FREE',
      trial_start_at: null,
      trial_end_at: null,
      lifecycle_status: 'ACTIVE',
      archived_at: null,
      status_last_updated_at: '2023-01-01T00:00:00Z',
      is_disputed: false,
      disputed_at: null,
      plan_source: 'FREE',
      last_active_at: '2023-01-01T00:00:00Z',
      trust_tier: 1,
      emergency_boost_eligible: 0,
      lifecycle_active: true,
      is_premium_active: false,
      trial_days_left: 0,
      is_trial: false
    }];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get(`/providers?cursor=${cursor}`);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('trust_tier'),
      expect.any(Array)
    );
  });

  it('should return 400 for invalid cursor', async () => {
    const response = await request(app).get('/providers?cursor=invalid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CURSOR');
  });

  it('should generate suggestions when no results', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await request(app).get('/providers?status=OPEN_NOW&island=STT');

    expect(response.status).toBe(200);
    expect(response.body.data.providers).toHaveLength(0);
    expect(response.body.data.suggestions).toBeDefined();
    expect(response.body.data.suggestions.length).toBeGreaterThan(0);
  });

  it('should exclude archived providers', async () => {
    const mockProviders = [
      { id: 1, name: 'Active Provider', lifecycle_status: 'ACTIVE', trust_score: 100 }
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get('/providers');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("p.lifecycle_status != 'ARCHIVED'"),
      expect.any(Array)
    );
  });

  it('should filter by valid island codes', async () => {
    const mockProviders = [
      { id: 1, name: 'STT Provider', island: 'STT', trust_score: 100 }
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get('/providers?island=STT');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('p.island = $'),
      expect.arrayContaining(['STT'])
    );
  });

  it('should return 400 for invalid island code', async () => {
    const response = await request(app).get('/providers?island=St.+Thomas');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ISLAND');
    expect(response.body.error.message).toBe('Island must be one of: STT, STX, STJ');
  });

  it('should return 400 for invalid island code in areas endpoint', async () => {
    const response = await request(app).get('/areas?island=St.+Thomas');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ISLAND');
  });

  it('should filter by status', async () => {
    const mockEmergencyMode = { rows: [{ value: { enabled: false } }] };
    const mockProviders = [{ id: 1, name: 'Available Provider', status: 'OPEN_NOW' }];
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce(mockEmergencyMode)
      .mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app).get('/providers?status=OPEN_NOW');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenNthCalledWith(2,
      expect.stringContaining('p.status = $'),
      expect.arrayContaining(['OPEN_NOW'])
    );
  });

  it('should filter by category ID', async () => {
    const mockEmergencyMode = { rows: [{ value: { enabled: false } }] };
    const mockProviders = [{ id: 1, name: 'Electrician', categoryId: '1' }];
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce(mockEmergencyMode)
      .mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app).get('/providers?categoryId=1');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenNthCalledWith(2,
      expect.stringContaining('EXISTS (SELECT 1 FROM provider_categories pc WHERE pc.provider_id = p.id AND pc.category_id = $'),
      expect.arrayContaining(['1'])
    );
  });

  it('should filter by area ID', async () => {
    const mockEmergencyMode = { rows: [{ value: { enabled: false } }] };
    const mockProviders = [{ id: 1, name: 'Provider in Area', areaId: '1' }];
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce(mockEmergencyMode)
      .mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app).get('/providers?areaId=1');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenNthCalledWith(2,
      expect.stringContaining('EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $'),
      expect.arrayContaining(['1'])
    );
  });

  it('should apply multiple filters simultaneously (island + status)', async () => {
    const mockEmergencyMode = { rows: [{ value: { enabled: false } }] };
    const mockProviders = [{ id: 1, name: 'Filtered Provider' }];
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce(mockEmergencyMode)
      .mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app).get('/providers?island=STT&status=OPEN_NOW');

    expect(response.status).toBe(200);
    const queryCall = (mockPool.query as jest.Mock).mock.calls[1][0];
    expect(queryCall).toContain('p.island = $');
    expect(queryCall).toContain('p.status = $');
    expect((mockPool.query as jest.Mock).mock.calls[1][1]).toEqual(expect.arrayContaining(['STT', 'OPEN_NOW']));
  });

  it('should apply all filters simultaneously (island + area + category + status)', async () => {
    const mockEmergencyMode = { rows: [{ value: { enabled: false } }] };
    const mockProviders = [{ id: 1, name: 'Fully Filtered Provider' }];
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce(mockEmergencyMode)
      .mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app).get('/providers?island=STT&areaId=1&categoryId=2&status=OPEN_NOW');

    expect(response.status).toBe(200);
    const queryCall = (mockPool.query as jest.Mock).mock.calls[1][0];
    expect(queryCall).toContain('p.island = $');
    expect(queryCall).toContain('p.status = $');
    expect(queryCall).toContain('EXISTS (SELECT 1 FROM provider_categories pc WHERE pc.provider_id = p.id AND pc.category_id = $');
    expect(queryCall).toContain('EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $');
    expect((mockPool.query as jest.Mock).mock.calls[1][1]).toEqual(expect.arrayContaining(['STT', 'OPEN_NOW', '2', '1']));
  });

  it('should return all providers when no filters applied', async () => {
    const mockProviders = [
      { id: 1, name: 'Provider 1' },
      { id: 2, name: 'Provider 2' },
      { id: 3, name: 'Provider 3' }
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get('/providers');

    expect(response.status).toBe(200);
    expect(response.body.data.providers).toHaveLength(3);
  });
});

describe('ActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log activity events successfully', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    // Import ActivityService dynamically since it's not exported
    const { ActivityService } = require('../server');

    await ActivityService.logEvent(1, 'PROFILE_UPDATED');

    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
      [1, 'PROFILE_UPDATED']
    );
  });

  it('should handle activity logging errors gracefully', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const { ActivityService } = require('../server');

    // Should not throw
    await expect(ActivityService.logEvent(1, 'PROFILE_UPDATED')).resolves.toBeUndefined();
  });
});

describe('PUT /providers/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup connect mock
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    // Setup client mock
    (mockClient.query as jest.Mock).mockImplementation((query: string) => {
      if (query.includes('SELECT id FROM categories')) {
        return Promise.resolve({ rows: [{ id: 1 }] });
      }
      if (query.includes('SELECT id FROM areas')) {
        return Promise.resolve({ rows: [{ id: 1 }] });
      }
      return Promise.resolve({});
    });
    (mockClient.release as jest.Mock).mockResolvedValue({});
  });

  it('should update provider profile and log activity', async () => {
    // Mock the activity logging
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .put('/providers/1')
      .send({
        name: 'Updated Name',
        phone: '123-456-7890',
        island: 'STT',
        categories: ['Electrician'],
        areas: [{ island: 'STT', neighborhood: 'Charlotte Amalie' }]
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Updated');
    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
      [1, 'PROFILE_UPDATED']
    );
  });
});

describe('PUT /providers/:id/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update provider status and log activity', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .put('/providers/1/status')
      .send({ status: 'TODAY' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Status updated');
    expect(mockPool.query).toHaveBeenCalledWith(
      'UPDATE providers SET status = $1, last_updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['TODAY', '1']
    );
    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
      [1, 'STATUS_UPDATED']
    );
  });
});

describe('GET /providers/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return provider details excluding archived', async () => {
    const mockProvider = {
      id: 1,
      name: 'Test Provider',
      lifecycle_status: 'ACTIVE'
    };
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockProvider] });

    const response = await request(app).get('/providers/1');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Test Provider');
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("p.lifecycle_status != 'ARCHIVED'"),
      ['1']
    );
  });

  it('should return 404 for archived provider', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await request(app).get('/providers/1');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Provider not found');
  });
});

describe('Admin Endpoints', () => {
  const adminHeaders = { 'x-admin-key': 'test-admin-key' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the admin key environment variable
    process.env.ADMIN_KEY = 'test-admin-key';
  });

  describe('GET /admin/providers', () => {
    it('should return all providers for admin', async () => {
      const mockProviders = [
        { id: 1, name: 'Provider 1', lifecycle_status: 'ACTIVE' },
        { id: 2, name: 'Provider 2', lifecycle_status: 'ARCHIVED' }
      ];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app)
        .get('/admin/providers')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT /admin/providers/:id/verify', () => {
    it('should verify provider and log activity', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .put('/admin/providers/1/verify')
        .set(adminHeaders)
        .send({ verified: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Provider verification updated');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO provider_badges'),
        ['1']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE providers SET status_last_updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        ['1']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
        [1, 'VERIFIED']
      );
    });
  });

  describe('PUT /admin/providers/:id/archive', () => {
    it('should archive provider and log activity', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ lifecycle_status: 'ACTIVE' }] }) // SELECT query
        .mockResolvedValueOnce({}) // UPDATE query
        .mockResolvedValueOnce({}) // Activity log
        .mockResolvedValueOnce({}); // Audit log

      const response = await request(app)
        .put('/admin/providers/1/archive')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Provider archived');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT lifecycle_status FROM providers WHERE id = $1',
        ['1']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE providers SET lifecycle_status = $1, status_last_updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        ['ARCHIVED', '1']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
        [1, 'ARCHIVED']
      );
    });
  });

  describe('POST /admin/jobs/recompute-provider-lifecycle', () => {
    it('should recompute provider lifecycle and return affected count', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 5 });

      const response = await request(app)
        .post('/admin/jobs/recompute-provider-lifecycle')
        .set(adminHeaders);

    });
  });
});

describe('GET /areas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return areas for a specific island', async () => {
    const mockAreas = [
      { id: 1, name: 'Charlotte Amalie', island: 'STT' },
      { id: 2, name: 'East End', island: 'STT' },
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockAreas });

    const response = await request(app).get('/areas?island=STT');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('Charlotte Amalie');
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT id, name FROM areas WHERE island = $1 ORDER BY name',
      ['STT']
    );
  });

  it('should return 400 if island parameter is missing', async () => {
    const response = await request(app).get('/areas');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Island parameter required');
  });
});

describe('POST /providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    (mockClient.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 1 }] }); // INSERT INTO providers
    (mockClient.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 1 }] }); // SELECT id FROM categories
    (mockClient.query as jest.Mock).mockResolvedValue({ rows: [] }); // Other queries
    // Mock pool.query for verification and activity logging - always return empty results
    (mockPool.query as jest.Mock).mockImplementation(() => Promise.resolve({ rows: [] }));
  });

  it('should create provider with island selection', async () => {
    const providerData = {
      name: 'Test Provider',
      email: 'test@example.com',
      password: 'password123',
      phone: '340-123-4567',
      island: 'STT',
      categories: ['Electrician'],
      emergency_calls_accepted: true,
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(1);
    expect(response.body.name).toBe('Test Provider');
    expect(response.body.token).toMatch(/^provider_1_\d+$/);
    expect(response.body.plan).toBe('PREMIUM');
    expect(response.body.plan_source).toBe('TRIAL');
    expect(response.body.trial_days_left).toBeGreaterThan(25); // Should be around 30 days
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO providers'),
      expect.arrayContaining([
        'Test Provider',
        'test@example.com',
        expect.stringContaining(':'), // password hash
        '340-123-4567',
        'STT',
        'PREMIUM',
        expect.any(Date),
        expect.any(Date),
        true, // contact_call_enabled (default)
        true, // contact_sms_enabled (default)
        true, // emergency_calls_accepted
      ])
    );
  });

  it('should fail if required fields missing', async () => {
    const providerData = {
      name: 'Test Provider',
      phone: '340-123-4567',
      categories: ['Electrician'],
      // missing email, password, and island
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Name, phone, island, email, and password are required');
  });

  it('should fail if no categories provided', async () => {
    const providerData = {
      name: 'Test Provider',
      email: 'test@example.com',
      password: 'password123',
      phone: '340-123-4567',
      island: 'STT',
      categories: [],
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('At least one category is required');
  });
});

describe('GET /providers with area filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter providers by areaId', async () => {
    const mockEmergencyMode = { rows: [{ value: { enabled: false } }] };
    const mockProviders = [
      { id: 1, name: 'Provider 1', trust_score: 100, last_active_at: null, status_last_updated_at: '2023-01-01T00:00:00Z' },
    ];
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce(mockEmergencyMode)
      .mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app).get('/providers?status=OPEN_NOW&areaId=1');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenNthCalledWith(2,
      expect.stringContaining('EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $2)'),
      expect.arrayContaining(['OPEN_NOW', '1'])
    );
  });
});

describe('POST /providers trial functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    (mockClient.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });
  });

  it('should create provider with 30-day premium trial', async () => {
    const providerData = {
      name: 'Test Provider',
      email: 'trial@example.com',
      password: 'password123',
      phone: '340-123-4567',
      island: 'STT',
      categories: ['Electrician'],
      areas: [1],
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      name: 'Test Provider',
      token: expect.stringMatching(/^provider_1_\d+$/),
      plan: 'PREMIUM',
      plan_source: 'TRIAL',
      trial_end_at: expect.any(String),
      trial_days_left: 30
    });

    // Verify the trial_end_at is approximately 30 days from now
    const trialEnd = new Date(response.body.trial_end_at);
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const diff = Math.abs(trialEnd.getTime() - (now.getTime() + thirtyDaysMs));
    expect(diff).toBeLessThan(1000); // Within 1 second
  });
});

describe('POST /admin/jobs/expire-trials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_KEY = 'test-admin-key';
  });

  it('should expire trials and downgrade providers', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 2 });

    const response = await request(app)
      .post('/admin/jobs/expire-trials')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: { downgradedCount: 2 },
      error: null
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE providers')
    );
  });

  it('should be idempotent - running twice yields 0', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 1 }) // First UPDATE
      .mockResolvedValueOnce({}) // First INSERT audit log
      .mockResolvedValueOnce({ rowCount: 0 }); // Second UPDATE

    // First run
    await request(app)
      .post('/admin/jobs/expire-trials')
      .set('x-admin-key', 'test-admin-key');

    // Second run
    const response = await request(app)
      .post('/admin/jobs/expire-trials')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body.data.downgradedCount).toBe(0);
  });
});

describe('Premium ranking boost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Premium Visibility within Trust Tiers', () => {
    it('should rank premium providers higher within the same trust tier', async () => {
      // Mock emergency mode query
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ value: { enabled: false } }] })
        .mockResolvedValueOnce({ rows: [
          {
            id: 1,
            name: 'Premium Provider',
            phone: '123-456-7890',
            island: 'St. John',
            profile: {},
            status: 'AVAILABLE',
            last_updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            plan: 'PREMIUM',
            trial_start_at: null,
            trial_end_at: null,
            lifecycle_status: 'ACTIVE',
            archived_at: null,
            status_last_updated_at: '2023-01-01T00:00:00Z',
            is_disputed: false,
            disputed_at: null,
            plan_source: 'PAID',
            last_active_at: null,
            trust_tier: 1, // NONE tier
            emergency_boost_eligible: false,
            lifecycle_active: true,
            is_premium_active: true,
            trial_days_left: 0,
            is_trial: false
          },
          {
            id: 2,
            name: 'Free Provider',
            phone: '098-765-4321',
            island: 'St. Thomas',
            profile: {},
            status: 'AVAILABLE',
            last_updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            plan: 'FREE',
            trial_start_at: null,
            trial_end_at: null,
            lifecycle_status: 'ACTIVE',
            archived_at: null,
            status_last_updated_at: '2023-01-01T00:00:00Z',
            is_disputed: false,
            disputed_at: null,
            plan_source: 'FREE',
            last_active_at: null,
            trust_tier: 1, // NONE tier
            emergency_boost_eligible: false,
            lifecycle_active: true,
            is_premium_active: false,
            trial_days_left: 0,
            is_trial: false
          }
        ] });

      const response = await request(app).get('/providers');

      expect(response.status).toBe(200);
      expect(response.body.data.providers[0].name).toBe('Premium Provider'); // Should rank higher within same tier
      expect(response.body.data.providers[1].name).toBe('Free Provider');
    });

    it('should rank trust tiers correctly regardless of premium status', async () => {
      // Mock emergency mode query
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ value: { enabled: false } }] })
        .mockResolvedValueOnce({ rows: [
          {
            id: 1,
            name: 'Free GOV Provider',
            phone: '111-111-1111',
            island: 'St. Croix',
            profile: {},
            status: 'AVAILABLE',
            last_updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            plan: 'FREE',
            trial_start_at: null,
            trial_end_at: null,
            lifecycle_status: 'ACTIVE',
            archived_at: null,
            status_last_updated_at: '2023-01-01T00:00:00Z',
            is_disputed: false,
            disputed_at: null,
            plan_source: 'FREE',
            last_active_at: null,
            trust_tier: 3, // GOV tier
            emergency_boost_eligible: false,
            lifecycle_active: true,
            is_premium_active: false,
            trial_days_left: 0,
            is_trial: false
          },
          {
            id: 2,
            name: 'Premium NONE Provider',
            phone: '222-222-2222',
            island: 'St. John',
            profile: {},
            status: 'AVAILABLE',
            last_updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            plan: 'PREMIUM',
            trial_start_at: null,
            trial_end_at: null,
            lifecycle_status: 'ACTIVE',
            archived_at: null,
            status_last_updated_at: '2023-01-01T00:00:00Z',
            is_disputed: false,
            disputed_at: null,
            plan_source: 'PAID',
            last_active_at: null,
            trust_tier: 1, // NONE tier
            emergency_boost_eligible: false,
            lifecycle_active: true,
            is_premium_active: true,
            trial_days_left: 0,
            is_trial: false
          }
        ] });

      const response = await request(app).get('/providers');

      expect(response.status).toBe(200);
      expect(response.body.data.providers[0].name).toBe('Free GOV Provider'); // GOV tier ranks highest
      expect(response.body.data.providers[1].name).toBe('Premium NONE Provider');
    });

    it('should boost premium providers with EMERGENCY_READY in emergency mode', async () => {
      // Mock emergency mode query
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ value: { enabled: true } }] })
        .mockResolvedValueOnce({ rows: [
          {
            id: 1,
            name: 'Premium EMERGENCY_READY',
            phone: '111-111-1111',
            island: 'St. Croix',
            profile: {},
            status: 'AVAILABLE',
            last_updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            plan: 'PREMIUM',
            trial_start_at: null,
            trial_end_at: null,
            lifecycle_status: 'ACTIVE',
            archived_at: null,
            status_last_updated_at: '2023-01-01T00:00:00Z',
            is_disputed: false,
            disputed_at: null,
            plan_source: 'PAID',
            last_active_at: null,
            trust_tier: 2, // VERIFIED tier
            emergency_boost_eligible: true,
            lifecycle_active: true,
            is_premium_active: true,
            trial_days_left: 0,
            is_trial: false
          },
          {
            id: 2,
            name: 'Premium VERIFIED (no emergency)',
            phone: '222-222-2222',
            island: 'St. John',
            profile: {},
            status: 'AVAILABLE',
            last_updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            plan: 'PREMIUM',
            trial_start_at: null,
            trial_end_at: null,
            lifecycle_status: 'ACTIVE',
            archived_at: null,
            status_last_updated_at: '2023-01-01T00:00:00Z',
            is_disputed: false,
            disputed_at: null,
            plan_source: 'PAID',
            last_active_at: null,
            trust_tier: 2, // VERIFIED tier
            emergency_boost_eligible: false,
            lifecycle_active: true,
            is_premium_active: true,
            trial_days_left: 0,
            is_trial: false
          }
        ] });

      const response = await request(app).get('/providers?emergency=true');

      expect(response.status).toBe(200);
      expect(response.body.data.providers[0].name).toBe('Premium EMERGENCY_READY'); // Should rank higher in emergency mode
      expect(response.body.data.providers[1].name).toBe('Premium VERIFIED (no emergency)');
    });
  });

  describe('Activity Guardrails', () => {
    it('should ignore activity-based filter parameters', async () => {
      const mockProviders = [
        {
          id: 1,
          name: 'Provider 1',
          phone: '123-456-7890',
          island: 'St. John',
          profile: {},
          status: 'AVAILABLE',
          last_updated_at: '2023-01-01T00:00:00Z',
          created_at: '2023-01-01T00:00:00Z',
          plan: 'FREE',
          trial_start_at: null,
          trial_end_at: null,
          lifecycle_status: 'ACTIVE',
          archived_at: null,
          status_last_updated_at: '2023-01-01T00:00:00Z',
          is_disputed: false,
          disputed_at: null,
          plan_source: 'FREE',
          last_active_at: '2023-01-01T00:00:00Z',
          trust_tier: 1,
          emergency_boost_eligible: false,
          lifecycle_active: true,
          is_premium_active: false,
          trial_days_left: 0,
          is_trial: false
        }
      ];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      // Test various activity-based parameter names that should be ignored
      const response = await request(app).get('/providers?activeWithinHours=24&recentlyActive=true&lastActivity=1day');

      expect(response.status).toBe(200);
      expect(response.body.data.providers).toHaveLength(1);
      // The query should not include these parameters in filtering
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.lifecycle_status != \'ARCHIVED\''),
        expect.any(Array)
      );
    });

    it('should return last_active_at in provider data', async () => {
      const mockProviders = [
        {
          id: 1,
          name: 'Provider 1',
          phone: '123-456-7890',
          island: 'St. John',
          profile: {},
          status: 'AVAILABLE',
          last_updated_at: '2023-01-01T00:00:00Z',
          created_at: '2023-01-01T00:00:00Z',
          plan: 'FREE',
          trial_start_at: null,
          trial_end_at: null,
          lifecycle_status: 'ACTIVE',
          archived_at: null,
          status_last_updated_at: '2023-01-01T00:00:00Z',
          is_disputed: false,
          disputed_at: null,
          plan_source: 'FREE',
          last_active_at: '2023-12-24T10:00:00Z',
          trust_tier: 1,
          emergency_boost_eligible: false,
          lifecycle_active: true,
          is_premium_active: false,
          trial_days_left: 0,
          is_trial: false
        }
      ];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app).get('/providers');

      expect(response.status).toBe(200);
      expect(response.body.data.providers[0]).toHaveProperty('last_active_at');
      expect(response.body.data.providers[0].last_active_at).toBe('2023-12-24T10:00:00Z');
    });
  });
});

describe('GET /health', () => {
  it('should return ok status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});

describe('GET /areas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return areas for valid island', async () => {
    const mockAreas = [
      { id: 1, name: 'Charlotte Amalie' },
      { id: 2, name: 'East End' },
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockAreas });

    const response = await request(app).get('/areas?island=STT');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAreas);
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT id, name FROM areas WHERE island = $1 ORDER BY name',
      ['STT']
    );
  });

  it('should return 400 for missing island parameter', async () => {
    const response = await request(app).get('/areas');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Island parameter required');
  });

  it('should return 400 for invalid island', async () => {
    const response = await request(app).get('/areas?island=INVALID');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ISLAND');
  });
});

describe('GET /categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Electrician' },
      { id: 2, name: 'Plumber' },
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockCategories });

    const response = await request(app).get('/categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockCategories);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT id, name FROM categories ORDER BY name');
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/categories');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('POST /login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const mockProvider = {
      id: 1,
      name: 'Test Provider',
      password_hash: 'salt:abcd1234'
    };
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockProvider] });

    // Mock crypto.pbkdf2Sync to return the expected hash
    const mockPbkdf2Sync = jest.spyOn(crypto, 'pbkdf2Sync');
    mockPbkdf2Sync.mockReturnValue(Buffer.from('abcd1234', 'hex'));

    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'Test Provider');
    expect(response.body).toHaveProperty('token');

    mockPbkdf2Sync.mockRestore();
  });

  it('should return 400 for missing email or password', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required');
  });

  it('should return 401 for invalid email', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await request(app)
      .post('/login')
      .send({ email: 'invalid@example.com', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password');
  });

  it('should return 401 for invalid password', async () => {
    const mockProvider = {
      id: 1,
      name: 'Test Provider',
      password_hash: 'salt:abcd1234'
    };
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockProvider] });

    const mockPbkdf2Sync = jest.spyOn(crypto, 'pbkdf2Sync');
    mockPbkdf2Sync.mockReturnValue(Buffer.from('wronghash', 'hex'));

    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password');

    mockPbkdf2Sync.mockRestore();
  });
});

describe('POST /forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send reset email for valid email', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

    const response = await request(app)
      .post('/forgot-password')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('password reset link');
  });

  it('should return success even for non-existent email', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await request(app)
      .post('/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('password reset link');
  });

  it('should return 400 for missing email', async () => {
    const response = await request(app)
      .post('/forgot-password')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email is required');
  });
});

describe('GET /providers/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return provider details', async () => {
    const mockProvider = {
      id: 1,
      name: 'Test Provider',
      phone: '340-123-4567',
      island: 'STT',
      profile: { experience: '10 years' },
      status: 'OPEN_NOW',
      lifecycle_status: 'ACTIVE',
      plan: 'FREE',
      plan_source: 'DEFAULT',
      trial_end_at: null,
      is_premium_active: false,
      trial_days_left: 0,
      is_trial: false,
      last_active_at: '2023-01-01T00:00:00Z',
      areas: [{ id: 1, name: 'Charlotte Amalie', island: 'STT' }]
    };
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [mockProvider] });

    const response = await request(app).get('/providers/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProvider);
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT p.*'), ['1']);
  });

  it('should return 404 for non-existent provider', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await request(app).get('/providers/999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Provider not found');
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/providers/1');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('POST /reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reset password successfully', async () => {
    const mockProvider = { id: 1 };
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [mockProvider] }) // Find provider
      .mockResolvedValueOnce({}); // Update password

    const response = await request(app)
      .post('/reset-password')
      .send({ token: 'valid-token', password: 'newpassword123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password reset successfully');
  });

  it('should return 400 for missing token or password', async () => {
    const response = await request(app)
      .post('/reset-password')
      .send({ token: 'token' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Token and password are required');
  });

  it('should return 400 for password too short', async () => {
    const response = await request(app)
      .post('/reset-password')
      .send({ token: 'token', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Password must be at least 8 characters long');
  });

  it('should return 400 for invalid token', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await request(app)
      .post('/reset-password')
      .send({ token: 'invalid-token', password: 'newpassword123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or expired reset token');
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/reset-password')
      .send({ token: 'token', password: 'newpassword123' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('PUT /providers/:id/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update provider status', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    // Mock VerificationService.updateVerificationStatus
    const mockUpdateVerificationStatus = jest.spyOn(require('../server').VerificationService, 'updateVerificationStatus');
    mockUpdateVerificationStatus.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/providers/1/status')
      .send({ status: 'BUSY_LIMITED' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Status updated');
    expect(mockPool.query).toHaveBeenCalledWith(
      'UPDATE providers SET status = $1, last_updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['BUSY_LIMITED', '1']
    );

    mockUpdateVerificationStatus.mockRestore();
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .put('/providers/1/status')
      .send({ status: 'OPEN_NOW' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('POST /providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new provider successfully', async () => {
    const mockProvider = { id: 1 };
    const mockCategory = { id: 1 };

    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [mockProvider] }) // INSERT provider
      .mockResolvedValueOnce({ rows: [mockCategory] }) // SELECT category
      .mockResolvedValueOnce({}) // INSERT provider_category
      .mockResolvedValueOnce({}); // COMMIT

    (mockPool.connect as jest.Mock).mockResolvedValue({
      query: mockPool.query,
      release: jest.fn()
    });

    const response = await request(app)
      .post('/providers')
      .send({
        name: 'Test Provider',
        email: 'test@example.com',
        password: 'password123',
        phone: '340-123-4567',
        island: 'STT',
        categories: ['Electrician']
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('plan', 'PREMIUM');
    expect(response.body).toHaveProperty('plan_source', 'TRIAL');
    expect(response.body).toHaveProperty('trial_days_left');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/providers')
      .send({ name: 'Test Provider' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Name, phone, island, email, and password are required');
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/providers')
      .send({
        name: 'Test Provider',
        email: 'invalid-email',
        password: 'password123',
        phone: '340-123-4567',
        island: 'STT',
        categories: ['Electrician']
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Please provide a valid email address');
  });

  it('should return 400 for password too short', async () => {
    const response = await request(app)
      .post('/providers')
      .send({
        name: 'Test Provider',
        email: 'test@example.com',
        password: 'short',
        phone: '340-123-4567',
        island: 'STT',
        categories: ['Electrician']
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Password must be at least 8 characters long');
  });

  it('should return 400 for no categories', async () => {
    const response = await request(app)
      .post('/providers')
      .send({
        name: 'Test Provider',
        email: 'test@example.com',
        password: 'password123',
        phone: '340-123-4567',
        island: 'STT',
        categories: []
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('At least one category is required');
  });

  it('should handle database errors', async () => {
    (mockPool.connect as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/providers')
      .send({
        name: 'Test Provider',
        email: 'test@example.com',
        password: 'password123',
        phone: '340-123-4567',
        island: 'STT',
        categories: ['Electrician']
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('PUT /providers/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update provider profile successfully', async () => {
    const mockCategory = { id: 1 };
    const mockArea = { id: 1 };

    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // UPDATE provider
      .mockResolvedValueOnce({}) // DELETE categories
      .mockResolvedValueOnce({ rows: [mockCategory] }) // SELECT category
      .mockResolvedValueOnce({}) // INSERT category
      .mockResolvedValueOnce({}) // DELETE areas
      .mockResolvedValueOnce({ rows: [{ island: 'STT' }] }) // SELECT provider island
      .mockResolvedValueOnce({ rows: [mockArea] }) // SELECT area
      .mockResolvedValueOnce({}) // INSERT area
      .mockResolvedValueOnce({}); // COMMIT

    (mockPool.connect as jest.Mock).mockResolvedValue({
      query: mockPool.query,
      release: jest.fn()
    });

    // Mock VerificationService.updateVerificationStatus
    const mockUpdateVerificationStatus = jest.spyOn(require('../server').VerificationService, 'updateVerificationStatus');
    mockUpdateVerificationStatus.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/providers/1')
      .send({
        name: 'Updated Name',
        phone: '340-987-6543',
        categories: ['Plumber'],
        areas: [1],
        island: 'STT',
        preferred_contact_method: 'CALL',
        emergency_calls_accepted: true
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Updated');

    mockUpdateVerificationStatus.mockRestore();
  });

  it('should return 400 for no areas', async () => {
    const response = await request(app)
      .put('/providers/1')
      .send({
        name: 'Updated Name',
        areas: []
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('At least one area is required');
  });

  it('should return 400 for invalid contact method', async () => {
    const response = await request(app)
      .put('/providers/1')
      .send({
        name: 'Updated Name',
        areas: [1],
        preferred_contact_method: 'EMAIL'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Preferred contact method must be enabled');
  });

  it('should handle database errors', async () => {
    (mockPool.connect as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .put('/providers/1')
      .send({
        name: 'Updated Name',
        areas: [1]
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('POST /reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit a report successfully', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/reports')
      .send({
        provider_id: 1,
        reason: 'Poor service',
        contact: 'customer@example.com'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Report submitted');
    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO reports (provider_id, reason, contact) VALUES ($1, $2, $3)',
      [1, 'Poor service', 'customer@example.com']
    );
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/reports')
      .send({
        provider_id: 1,
        reason: 'Poor service',
        contact: 'customer@example.com'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('POST /providers/:id/customer-interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log customer call interaction', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/providers/1/customer-interaction')
      .send({ type: 'call' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Interaction logged');
  });

  it('should log customer sms interaction', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/providers/1/customer-interaction')
      .send({ type: 'sms' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Interaction logged');
  });

  it('should return 400 for invalid interaction type', async () => {
    const response = await request(app)
      .post('/providers/1/customer-interaction')
      .send({ type: 'email' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid interaction type. Must be "call" or "sms"');
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/providers/1/customer-interaction')
      .send({ type: 'call' });

    expect(response.status).toBe(200); // Activity logging doesn't fail the main operation
    expect(response.body.message).toBe('Interaction logged');
  });
});

describe('POST /providers/:id/profile-view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log profile view', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    // Mock VerificationService.updateVerificationStatus
    const mockUpdateVerificationStatus = jest.spyOn(require('../server').VerificationService, 'updateVerificationStatus');
    mockUpdateVerificationStatus.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/providers/1/profile-view');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile view logged');

    mockUpdateVerificationStatus.mockRestore();
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/providers/1/profile-view');

    expect(response.status).toBe(200); // Activity logging doesn't fail the main operation
    expect(response.body.message).toBe('Profile view logged');
  });
});

describe('POST /providers/:id/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log provider login', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/providers/1/login');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login logged');
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/providers/1/login');

    expect(response.status).toBe(200); // Activity logging doesn't fail the main operation
    expect(response.body.message).toBe('Login logged');
  });
});

describe('GET /providers/:id/insights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return provider insights for 7 days', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [{ calls: '5', sms: '3' }]
    });

    const response = await request(app)
      .get('/providers/1/insights');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ calls: 5, sms: 3 });
  });

  it('should return provider insights for 30 days', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [{ calls: '12', sms: '8' }]
    });

    const response = await request(app)
      .get('/providers/1/insights?range=30d');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ calls: 12, sms: 8 });
  });

  it('should return zero insights when no data', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [{ calls: null, sms: null }]
    });

    const response = await request(app)
      .get('/providers/1/insights');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ calls: 0, sms: 0 });
  });

  it('should handle database errors', async () => {
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/providers/1/insights');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});

describe('GET /admin/providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all providers for admin', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [
        { id: 1, name: 'Test Provider', island: 'STT', status: 'OPEN_NOW' },
        { id: 2, name: 'Another Provider', island: 'STX', status: 'BUSY_LIMITED' }
      ]
    });

    const response = await request(app)
      .get('/admin/providers')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('should filter providers by island', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, name: 'STT Provider', island: 'STT' }]
    });

    const response = await request(app)
      .get('/admin/providers?island=STT')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body[0].island).toBe('STT');
  });

  it('should reject invalid island parameter', async () => {
    const response = await request(app)
      .get('/admin/providers?island=INVALID')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ISLAND');
  });

  it('should reject unauthorized requests', async () => {
    const response = await request(app)
      .get('/admin/providers');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
});

describe('PUT /admin/providers/:id/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify a provider', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .put('/admin/providers/1/verify')
      .set('x-admin-key', 'test-admin-key')
      .send({ verified: true });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider verification updated');
  });

  it('should unverify a provider', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .put('/admin/providers/1/verify')
      .set('x-admin-key', 'test-admin-key')
      .send({ verified: false });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider verification updated');
  });

  it('should reject unauthorized requests', async () => {
    const response = await request(app)
      .put('/admin/providers/1/verify')
      .send({ verified: true });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
});

describe('PUT /admin/providers/:id/gov-approve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should approve government credentials for a provider', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .put('/admin/providers/1/gov-approve')
      .set('x-admin-key', 'test-admin-key')
      .send({ approved: true });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider government approval updated');
  });

  it('should revoke government approval for a provider', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .put('/admin/providers/1/gov-approve')
      .set('x-admin-key', 'test-admin-key')
      .send({ approved: false });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider government approval updated');
  });

  it('should reject unauthorized requests', async () => {
    const response = await request(app)
      .put('/admin/providers/1/gov-approve')
      .send({ approved: true });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
});

describe('PUT /admin/providers/:id/archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should archive an active provider', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ lifecycle_status: 'ACTIVE' }] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .put('/admin/providers/1/archive')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider archived');
  });

  it('should unarchive an archived provider', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ lifecycle_status: 'ARCHIVED' }] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .put('/admin/providers/1/archive')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider unarchived');
  });

  it('should return 404 for non-existent provider', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const response = await request(app)
      .put('/admin/providers/999/archive')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Provider not found');
  });
});

describe('PATCH /admin/providers/:id/disputed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark provider as disputed', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .patch('/admin/providers/1/disputed')
      .set('x-admin-key', 'test-admin-key')
      .send({ isDisputed: true, notes: 'Test dispute' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider marked as disputed');
  });

  it('should unmark provider as disputed', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .patch('/admin/providers/1/disputed')
      .set('x-admin-key', 'test-admin-key')
      .send({ isDisputed: false });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Provider unmarked as disputed');
  });
});

describe('POST /admin/jobs/recompute-provider-lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should recompute provider lifecycle', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 5 });

    const response = await request(app)
      .post('/admin/jobs/recompute-provider-lifecycle')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Lifecycle recomputed for 5 providers');
  });
});

describe('POST /admin/jobs/expire-trials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expire trials', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 3 });

    const response = await request(app)
      .post('/admin/jobs/expire-trials')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body.data.downgradedCount).toBe(3);
  });
});

describe('GET /admin/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return reports for admin', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [
        { id: 1, provider_name: 'Test Provider', reason: 'Test report' }
      ]
    });

    const response = await request(app)
      .get('/admin/reports')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('should filter reports by status', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, status: 'IN_REVIEW' }]
    });

    const response = await request(app)
      .get('/admin/reports?status=IN_REVIEW')
      .set('x-admin-key', 'test-admin-key');

    expect(response.status).toBe(200);
  });
});

describe('PATCH /admin/reports/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update report status', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ status: 'NEW' }] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .patch('/admin/reports/1')
      .set('x-admin-key', 'test-admin-key')
      .send({ status: 'RESOLVED', adminNotes: 'Fixed' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Report updated successfully');
  });
});

describe('PATCH /admin/settings/emergency-mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enable emergency mode', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ value: { enabled: false } }] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .patch('/admin/settings/emergency-mode')
      .set('x-admin-key', 'test-admin-key')
      .send({ enabled: true, notes: 'Emergency declared' });

    expect(response.status).toBe(200);
    expect(response.body.enabled).toBe(true);
  });

  it('should disable emergency mode', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ value: { enabled: true } }] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .patch('/admin/settings/emergency-mode')
      .set('x-admin-key', 'test-admin-key')
      .send({ enabled: false });

    expect(response.status).toBe(200);
    expect(response.body.enabled).toBe(false);
  });
});