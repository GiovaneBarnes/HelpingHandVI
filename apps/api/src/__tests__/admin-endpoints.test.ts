import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../server';

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

const mockPool = new Pool();
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

describe('Admin Endpoints', () => {
  const adminHeaders = { 'x-admin-key': 'test-admin-key' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the admin key environment variable
    process.env.ADMIN_KEY = 'test-admin-key';
  });

  describe('GET /admin/providers', () => {
    it('should return all providers including archived ones', async () => {
      const mockProviders = [
        { id: 1, name: 'Active Provider', lifecycle_status: 'ACTIVE' },
        { id: 2, name: 'Inactive Provider', lifecycle_status: 'INACTIVE' },
        { id: 3, name: 'Archived Provider', lifecycle_status: 'ARCHIVED' }
      ];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app)
        .get('/admin/providers')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(mockProviders);
    });

    it('should require admin authentication', async () => {
      // Remove the mock to test actual auth
      jest.restoreAllMocks();

      const response = await request(app).get('/admin/providers');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should filter by island', async () => {
      const mockProviders = [{ id: 1, name: 'STT Provider', island: 'STT' }];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app)
        .get('/admin/providers?island=STT')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('p.island = $'),
        expect.arrayContaining(['STT'])
      );
    });

    it('should filter by status', async () => {
      const mockProviders = [{ id: 1, name: 'Available Provider', status: 'OPEN_NOW' }];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app)
        .get('/admin/providers?status=OPEN_NOW')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('p.status = $'),
        expect.arrayContaining(['OPEN_NOW'])
      );
    });

    it('should filter by category ID', async () => {
      const mockProviders = [{ id: 1, name: 'Electrician' }];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app)
        .get('/admin/providers?categoryId=1')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS (SELECT 1 FROM provider_categories pc WHERE pc.provider_id = p.id AND pc.category_id = $'),
        expect.arrayContaining(['1'])
      );
    });

    it('should filter by area ID', async () => {
      const mockProviders = [{ id: 1, name: 'Provider in Area' }];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app)
        .get('/admin/providers?areaId=1')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $'),
        expect.arrayContaining(['1'])
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      const mockProviders = [{ id: 1, name: 'Filtered Provider' }];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockProviders });

      const response = await request(app)
        .get('/admin/providers?island=STT&status=OPEN_NOW&categoryId=1&areaId=2')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      const queryCall = (mockPool.query as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('p.island = $');
      expect(queryCall).toContain('p.status = $');
      expect(queryCall).toContain('EXISTS (SELECT 1 FROM provider_categories pc WHERE pc.provider_id = p.id AND pc.category_id = $');
      expect(queryCall).toContain('EXISTS (SELECT 1 FROM provider_areas pa WHERE pa.provider_id = p.id AND pa.area_id = $');
      expect((mockPool.query as jest.Mock).mock.calls[0][1]).toEqual(expect.arrayContaining(['STT', 'OPEN_NOW', '1', '2']));
    });
  });

  describe('PUT /admin/providers/:id/verify', () => {
    it('should verify a provider and log VERIFIED event', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .put('/admin/providers/123/verify')
        .set(adminHeaders)
        .send({ verified: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Provider verification updated');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO provider_badges'),
        ['123']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE providers SET status_last_updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        ['123']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
        [123, 'VERIFIED']
      );
    });

    it('should unverify a provider', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .put('/admin/providers/456/verify')
        .set(adminHeaders)
        .send({ verified: false });

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM provider_badges'),
        ['456']
      );
    });

    it('should handle database errors', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/admin/providers/123/verify')
        .set(adminHeaders)
        .send({ verified: true });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /admin/providers/:id/archive', () => {
    it('should archive a provider and log ARCHIVED event', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ lifecycle_status: 'ACTIVE' }] }) // SELECT query
        .mockResolvedValueOnce({}) // UPDATE query
        .mockResolvedValueOnce({}) // Activity log
        .mockResolvedValueOnce({}); // Audit log

      const response = await request(app)
        .put('/admin/providers/789/archive')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Provider archived');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT lifecycle_status FROM providers WHERE id = $1',
        ['789']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE providers SET lifecycle_status = $1, status_last_updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        ['ARCHIVED', '789']
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
        [789, 'ARCHIVED']
      );
    });

    it('should handle database errors', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ lifecycle_status: 'ACTIVE' }] }) // SELECT succeeds
        .mockRejectedValue(new Error('Database error')); // UPDATE fails

      const response = await request(app)
        .put('/admin/providers/789/archive')
        .set(adminHeaders);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /admin/jobs/recompute-provider-lifecycle', () => {
    it('should recompute lifecycle for providers with recent activity', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 3 });

      const response = await request(app)
        .post('/admin/jobs/recompute-provider-lifecycle')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Lifecycle recomputed for 3 providers');

      // Verify the complex query was called
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('provider_activity AS')
      );
    });

    it('should handle no providers needing updates', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const response = await request(app)
        .post('/admin/jobs/recompute-provider-lifecycle')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Lifecycle recomputed for 0 providers');
    });

    it('should handle database errors', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/admin/jobs/recompute-provider-lifecycle')
        .set(adminHeaders);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      jest.restoreAllMocks(); // Use real auth for these tests
    });

    it('should reject requests without admin key', async () => {
      const response = await request(app).get('/admin/providers');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid admin key', async () => {
      const response = await request(app)
        .get('/admin/providers')
        .set('x-admin-key', 'invalid-key');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});