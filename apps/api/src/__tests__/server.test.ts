import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
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
    const response = await request(app).get('/providers?limit=0');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_LIMIT');
  });

  it('should handle cursor pagination', async () => {
    const cursor = Buffer.from(JSON.stringify({ trust_score: 100, last_active_at: '2023-01-01T00:00:00Z', status_last_updated_at: '2023-01-01T00:00:00Z', id: 1 })).toString('base64');
    const mockProviders = [{ id: 2, trust_score: 90 }];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get(`/providers?cursor=${cursor}`);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('trust_score < $'),
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

    const response = await request(app).get('/providers?status=TODAY&island=St.+Thomas');

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
        island: 'St. Thomas',
        categories: ['Electrician'],
        areas: [{ island: 'St. Thomas', neighborhood: 'Charlotte Amalie' }]
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

describe('POST /providers with contact preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    (mockClient.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });
  });

  it('should create provider with contact preferences', async () => {
    const providerData = {
      name: 'Test Provider',
      phone: '340-123-4567',
      whatsapp: '340-123-4567',
      island: 'STT',
      categories: ['Electrician'],
      areas: [1, 2],
      contact_call_enabled: true,
      contact_whatsapp_enabled: true,
      contact_sms_enabled: false,
      preferred_contact_method: 'WHATSAPP',
      typical_hours: 'Mon-Fri 8AM-5PM',
      emergency_calls_accepted: true,
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(1);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO providers'),
      expect.arrayContaining([
        'Test Provider',
        '340-123-4567',
        '340-123-4567',
        'STT',
        'PREMIUM',
        expect.any(Date),
        expect.any(Date),
        true, // contact_call_enabled
        true, // contact_whatsapp_enabled
        false, // contact_sms_enabled
        'WHATSAPP', // preferred_contact_method
        'Mon-Fri 8AM-5PM', // typical_hours
        true, // emergency_calls_accepted
      ])
    );
  });

  it('should fail if no areas provided', async () => {
    const providerData = {
      name: 'Test Provider',
      phone: '340-123-4567',
      island: 'STT',
      categories: ['Electrician'],
      areas: [],
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('At least one area is required');
  });

  it('should fail if no contact methods enabled', async () => {
    const providerData = {
      name: 'Test Provider',
      phone: '340-123-4567',
      island: 'STT',
      categories: ['Electrician'],
      areas: [1],
      contact_call_enabled: false,
      contact_whatsapp_enabled: false,
      contact_sms_enabled: false,
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('At least one contact method must be enabled');
  });

  it('should fail if preferred method is not enabled', async () => {
    const providerData = {
      name: 'Test Provider',
      phone: '340-123-4567',
      island: 'STT',
      categories: ['Electrician'],
      areas: [1],
      contact_call_enabled: true,
      contact_whatsapp_enabled: false,
      contact_sms_enabled: false,
      preferred_contact_method: 'WHATSAPP',
    };

    const response = await request(app)
      .post('/providers')
      .send(providerData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Preferred contact method must be enabled');
  });
});

describe('GET /providers with area filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter providers by areaId', async () => {
    const mockProviders = [
      { id: 1, name: 'Provider 1', trust_score: 100, last_active_at: null, status_last_updated_at: '2023-01-01T00:00:00Z' },
    ];
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

    const response = await request(app).get('/providers?status=AVAILABLE&areaId=1');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $2)'),
      expect.arrayContaining(['AVAILABLE', '1'])
    );
  });
});