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
    connect: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

const mockPool = new Pool();
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
      (mockPool.query as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .put('/admin/providers/1/archive')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Provider archived');
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE providers SET lifecycle_status = 'ARCHIVED', status_last_updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        ['1']
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

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('5 providers');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('lifecycle_updates AS')
      );
    });
  });
});