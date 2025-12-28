import request from 'supertest';
import { Pool } from 'pg';

// Mock the pool before importing the app
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

// Import app after mocking
import { app } from '../server';

// Set up test environment variables
process.env.ADMIN_KEY = 'test-admin-key';
process.env.NODE_ENV = 'test';

const mockPool = new Pool() as any;

describe('Public Providers Badge Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProviders = [
    {
      id: 1,
      name: 'Verified Provider',
      phone: '123-456-7890',
      island: 'STT',
      status: 'OPEN_NOW',
      lifecycle_status: 'ACTIVE',
      is_premium_active: false,
      is_trial: false,
      trust_tier: 2,
      emergency_boost_eligible: 0,
      categories: ['Plumbing'],
      badges: ['VERIFIED'],
      created_at: '2024-01-01T00:00:00Z',
      last_active_at: '2024-01-15T00:00:00Z',
      plan: 'FREE',
      plan_source: null,
      trial_end_at: null,
      disputed: false
    },
    {
      id: 2,
      name: 'Gov Approved Provider',
      phone: '123-456-7891',
      island: 'STJ',
      status: 'BUSY_LIMITED',
      lifecycle_status: 'ACTIVE',
      is_premium_active: true,
      is_trial: false,
      trust_tier: 3,
      emergency_boost_eligible: 0,
      categories: ['Electrical'],
      badges: ['GOV_APPROVED'],
      created_at: '2024-01-01T00:00:00Z',
      last_active_at: '2024-01-15T00:00:00Z',
      plan: 'PREMIUM',
      plan_source: null,
      trial_end_at: null,
      disputed: false
    },
    {
      id: 3,
      name: 'Unverified Provider',
      phone: '123-456-7892',
      island: 'STX',
      status: 'OPEN_NOW',
      lifecycle_status: 'ACTIVE',
      is_premium_active: false,
      is_trial: false,
      trust_tier: 1,
      emergency_boost_eligible: 0,
      categories: ['Carpentry'],
      badges: [],
      created_at: '2024-01-01T00:00:00Z',
      last_active_at: '2024-01-15T00:00:00Z',
      plan: 'FREE',
      plan_source: null,
      trial_end_at: null,
      disputed: false
    },
    {
      id: 4,
      name: 'Fully Verified Provider',
      phone: '123-456-7893',
      island: 'STT',
      status: 'OPEN_NOW',
      lifecycle_status: 'ACTIVE',
      is_premium_active: true,
      is_trial: false,
      trust_tier: 3,
      emergency_boost_eligible: 1,
      categories: ['Plumbing', 'Electrical'],
      badges: ['VERIFIED', 'GOV_APPROVED', 'EMERGENCY_READY'],
      created_at: '2024-01-01T00:00:00Z',
      last_active_at: '2024-01-15T00:00:00Z',
      plan: 'PREMIUM',
      plan_source: null,
      trial_end_at: null,
      disputed: false
    }
  ];

  it('returns providers with badge information', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: mockProviders.slice(0, 3), // Return first 3 providers
    });

    const response = await request(app)
      .get('/providers');

    expect(response.status).toBe(200);
    expect(response.body.data.providers).toHaveLength(3);

    // Check that badges are included in the response
    expect(response.body.data.providers[0]).toHaveProperty('badges');
    expect(response.body.data.providers[1]).toHaveProperty('badges');
    expect(response.body.data.providers[2]).toHaveProperty('badges');

    // Check specific badge values
    expect(response.body.data.providers[0].badges).toEqual(['VERIFIED']);
    expect(response.body.data.providers[1].badges).toEqual(['GOV_APPROVED']);
    expect(response.body.data.providers[2].badges).toEqual([]);
  });

  it('returns providers with multiple badges', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [mockProviders[3]], // Return provider with multiple badges
    });

    const response = await request(app)
      .get('/providers');

    expect(response.status).toBe(200);
    expect(response.body.data.providers).toHaveLength(1);

    const provider = response.body.data.providers[0];
    expect(provider.badges).toEqual(['VERIFIED', 'GOV_APPROVED', 'EMERGENCY_READY']);
    expect(provider.badges).toHaveLength(3);
  });

  it('returns empty badges array for providers without badges', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [mockProviders[2]], // Return provider with no badges
    });

    const response = await request(app)
      .get('/providers');

    expect(response.status).toBe(200);
    expect(response.body.data.providers[0].badges).toEqual([]);
  });

  it('includes badges in cursor-based pagination', async () => {
    const cursorData = {
      trust_tier: 2,
      is_premium_active: false,
      emergency_boost_eligible: 0,
      lifecycle_active: true,
      last_active_at: '2024-01-15T00:00:00Z',
      status_last_updated_at: '2024-01-15T00:00:00Z',
      id: 1
    };

    const cursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');

    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [mockProviders[1]], // Return next provider
    });

    const response = await request(app)
      .get(`/providers?cursor=${cursor}`);

    expect(response.status).toBe(200);
    expect(response.body.data.providers[0]).toHaveProperty('badges');
    expect(Array.isArray(response.body.data.providers[0].badges)).toBe(true);
  });

  it('maintains badge data structure across different query parameters', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: mockProviders.slice(0, 2),
    });

    // Test with island filter
    const response = await request(app)
      .get('/providers?island=STT');

    expect(response.status).toBe(200);
    response.body.data.providers.forEach((provider: any) => {
      expect(provider).toHaveProperty('badges');
      expect(Array.isArray(provider.badges)).toBe(true);
    });
  });

  it('handles providers with emergency ready badge', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [mockProviders[3]], // Provider with EMERGENCY_READY badge
    });

    const response = await request(app)
      .get('/providers');

    expect(response.status).toBe(200);
    const provider = response.body.data.providers[0];
    expect(provider.badges).toContain('EMERGENCY_READY');
    expect(provider.emergency_boost_eligible).toBe(1);
  });
});