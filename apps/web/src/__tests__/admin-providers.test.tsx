import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminProviders } from '../pages/AdminProviders';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock alert
global.alert = vi.fn();

describe('AdminProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Mock admin login
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/admin/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <AdminProviders />
        </MemoryRouter>
      );
    }).not.toThrow();
  });
});