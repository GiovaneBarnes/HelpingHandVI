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

describe('Admin Providers Filtering', () => {
  const adminHeaders = { 'x-admin-key': 'test-admin-key' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the admin key environment variable
    process.env.ADMIN_KEY = 'test-admin-key';
  });

  const mockProviders = [
    {
      id: 1,
      name: 'Verified Provider',
      phone: '123-456-7890',
      island: 'STT',
      status: 'OPEN_NOW',
      archived: false,
      is_disputed: false,
      badges: ['VERIFIED'],
      lifecycle_status: 'ACTIVE',
    },
    {
      id: 2,
      name: 'Unverified Provider',
      phone: '123-456-7891',
      island: 'STX',
      status: 'BUSY_LIMITED',
      archived: false,
      is_disputed: false,
      badges: [],
      lifecycle_status: 'ACTIVE',
    },
    {
      id: 3,
      name: 'Archived Provider',
      phone: '123-456-7892',
      island: 'STJ',
      status: 'NOT_TAKING_WORK',
      archived: true,
      is_disputed: false,
      badges: ['GOV_APPROVED'],
      lifecycle_status: 'ARCHIVED',
    },
    {
      id: 4,
      name: 'Disputed Provider',
      phone: '123-456-7893',
      island: 'STT',
      status: 'OPEN_NOW',
      archived: false,
      is_disputed: true,
      badges: ['VERIFIED', 'GOV_APPROVED'],
      lifecycle_status: 'ACTIVE',
    },
  ];

  it('returns all providers without filters', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app)
      .get('/admin/providers')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT p.*'),
      []
    );
  });

  it('filters by verified status', async () => {
    const verifiedProviders = [mockProviders[0], mockProviders[3]];
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: verifiedProviders });

    const response = await request(app)
      .get('/admin/providers?verified=true')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("EXISTS (SELECT 1 FROM provider_badges pb WHERE pb.provider_id = p.id AND pb.badge = 'VERIFIED')"),
      []
    );
  });

  it('filters by unverified status', async () => {
    const unverifiedProviders = [mockProviders[1], mockProviders[2]];
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: unverifiedProviders });

    const response = await request(app)
      .get('/admin/providers?verified=false')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("NOT EXISTS (SELECT 1 FROM provider_badges pb WHERE pb.provider_id = p.id AND pb.badge = 'VERIFIED')"),
      []
    );
  });

  it('filters by government approved status', async () => {
    const govApprovedProviders = [mockProviders[2], mockProviders[3]];
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: govApprovedProviders });

    const response = await request(app)
      .get('/admin/providers?govApproved=true')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("EXISTS (SELECT 1 FROM provider_badges pb WHERE pb.provider_id = p.id AND pb.badge = 'GOV_APPROVED')"),
      []
    );
  });

  it('filters by archived status', async () => {
    const archivedProviders = [mockProviders[2]];
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: archivedProviders });

    const response = await request(app)
      .get('/admin/providers?archived=true')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("(p.lifecycle_status = 'ARCHIVED') = $"),
      [true]
    );
  });

  it('filters by active (non-archived) status', async () => {
    const activeProviders = [mockProviders[0], mockProviders[1], mockProviders[3]];
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: activeProviders });

    const response = await request(app)
      .get('/admin/providers?archived=false')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("(p.lifecycle_status = 'ARCHIVED') = $"),
      [false]
    );
  });

  it('filters by disputed status', async () => {
    const disputedProviders = [mockProviders[3]];
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: disputedProviders });

    const response = await request(app)
      .get('/admin/providers?disputed=true')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('p.is_disputed = $'),
      [true]
    );
  });

  it('combines multiple filters', async () => {
    const filteredProviders = [mockProviders[3]]; // Verified, Gov Approved, Active, Disputed
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: filteredProviders });

    const response = await request(app)
      .get('/admin/providers?verified=true&govApproved=true&archived=false&disputed=true')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    const queryCall = (mockPool.query as jest.Mock).mock.calls[0][0];
    expect(queryCall).toContain("EXISTS (SELECT 1 FROM provider_badges pb WHERE pb.provider_id = p.id AND pb.badge = 'VERIFIED')");
    expect(queryCall).toContain("EXISTS (SELECT 1 FROM provider_badges pb WHERE pb.provider_id = p.id AND pb.badge = 'GOV_APPROVED')");
    expect(queryCall).toContain("(p.lifecycle_status = 'ARCHIVED') = $");
    expect(queryCall).toContain('p.is_disputed = $');
  });

  it('validates boolean filter parameters', async () => {
    const response = await request(app)
      .get('/admin/providers?verified=invalid')
      .set(adminHeaders);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_VERIFIED');
  });

  it('validates island parameter', async () => {
    const response = await request(app)
      .get('/admin/providers?island=INVALID')
      .set(adminHeaders);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ISLAND');
  });

  it('validates status parameter', async () => {
    const response = await request(app)
      .get('/admin/providers?status=INVALID_STATUS')
      .set(adminHeaders);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_STATUS');
  });

  it('validates categoryId parameter', async () => {
    const response = await request(app)
      .get('/admin/providers?categoryId=not-a-number')
      .set(adminHeaders);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CATEGORY_ID');
  });

  it('validates areaId parameter', async () => {
    const response = await request(app)
      .get('/admin/providers?areaId=not-a-number')
      .set(adminHeaders);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_AREA_ID');
  });

  it('requires admin authentication', async () => {
    const response = await request(app)
      .get('/admin/providers');

    expect(response.status).toBe(401);
  });

  it('includes badges in response', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockProviders });

    const response = await request(app)
      .get('/admin/providers')
      .set(adminHeaders);

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('(SELECT COALESCE(json_agg(pb2.badge)'),
      []
    );
  });
});