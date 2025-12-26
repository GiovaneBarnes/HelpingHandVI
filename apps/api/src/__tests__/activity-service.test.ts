import { ActivityService } from '../server';
import { Pool } from 'pg';

// Mock the pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

const mockPool = new Pool();

describe('ActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log PROFILE_UPDATED event', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    await ActivityService.logEvent(123, 'PROFILE_UPDATED');

    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
      [123, 'PROFILE_UPDATED']
    );
  });

  it('should log STATUS_UPDATED event', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    await ActivityService.logEvent(456, 'STATUS_UPDATED');

    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
      [456, 'STATUS_UPDATED']
    );
  });

  it('should log VERIFIED event', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    await ActivityService.logEvent(789, 'VERIFIED');

    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
      [789, 'VERIFIED']
    );
  });

  it('should log ARCHIVED event', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    await ActivityService.logEvent(999, 'ARCHIVED');

    expect(mockPool.query).toHaveBeenCalledWith(
      'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
      [999, 'ARCHIVED']
    );
  });

  it('should handle database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    // Should not throw, just log error
    await expect(ActivityService.logEvent(123, 'PROFILE_UPDATED')).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to log activity event:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should handle all valid activity event types', async () => {
    (mockPool.query as jest.Mock).mockResolvedValue({});

    const validEventTypes = [
      'PROFILE_UPDATED',
      'STATUS_UPDATED',
      'VERIFIED',
      'ARCHIVED'
    ];

    for (const eventType of validEventTypes) {
      await ActivityService.logEvent(1, eventType as any);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO activity_events (provider_id, event_type) VALUES ($1, $2)',
        [1, eventType]
      );
    }

    expect(mockPool.query).toHaveBeenCalledTimes(validEventTypes.length);
  });
});