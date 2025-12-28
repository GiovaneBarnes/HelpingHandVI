import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AdminSettings } from './AdminSettings';

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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/admin/settings' }),
  };
});

// Mock window.location
delete (global as any).window.location;
(global as any).window.location = { href: '' };

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Mock logged in
    
    // Mock all fetch calls
    fetchMock.mockImplementation((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : url.url;
      
      if (urlString.includes('/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { enabled: false }, error: null }),
        });
      }
      
      if (urlString.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'healthy',
            checks: {
              database: { status: 'healthy', details: { latency: 8 } },
              providers: { status: 'healthy', details: { count: 0 } },
              reports: { status: 'healthy', details: { count: 0 } },
              activity: { status: 'healthy', details: { events: 0 } },
              system: { status: 'healthy', details: { categories: 17, areas: 11 } }
            }
          }),
        });
      }
      
      if (urlString.includes('/admin/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { enabled: true }, error: null }),
        });
      }
      
      return Promise.reject(new Error(`Unknown endpoint: ${urlString}`));
    });
  });

  it('renders admin settings page with title', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Mode')).toBeInTheDocument();
    });
  });

  it('redirects to login if not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<AdminSettings />);

    expect(window.location.href).toBe('/admin/login');
  });

  it('fetches emergency mode status on mount', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/settings/emergency-mode'
      );
    });
  });

  it('displays loading state initially', () => {
    render(<AdminSettings />);

    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('displays emergency mode status when disabled', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('INACTIVE')).toBeInTheDocument();
      expect(screen.getByText('🚨 Enable Emergency Mode')).toBeInTheDocument();
    });
  });

  it('displays emergency mode status when enabled', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: true, data: { enabled: true }, error: null }),
    });

    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('🔕 Disable Emergency Mode')).toBeInTheDocument();
      expect(screen.getByText('Emergency Mode is Active')).toBeInTheDocument();
    });
  });

  it('handles emergency mode toggle to enable', async () => {
    global.prompt = vi.fn(() => 'Enabling emergency mode');

    render(<AdminSettings />);

    await waitFor(() => {
      const enableButton = screen.getByText('🚨 Enable Emergency Mode');
      fireEvent.click(enableButton);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/settings/emergency-mode',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ enabled: true, notes: 'Enabling emergency mode' }),
        })
      );
    });
  });

  it('handles emergency mode toggle to disable', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: true, data: { enabled: true }, error: null }),
    });
    global.prompt = vi.fn(() => 'Disabling emergency mode');

    render(<AdminSettings />);

    await waitFor(() => {
      const disableButton = screen.getByText('🔕 Disable Emergency Mode');
      fireEvent.click(disableButton);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/settings/emergency-mode',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ enabled: false, notes: 'Disabling emergency mode' }),
        })
      );
    });
  });

  it('updates UI after successful toggle', async () => {
    global.prompt = vi.fn(() => 'Test notes');

    // Override the mock to return enabled after toggle
    fetchMock.mockImplementation((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : url.url;
      
      if (urlString.includes('/settings/emergency-mode') && !urlString.includes('/admin/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { enabled: false }, error: null }),
        });
      }
      
      if (urlString.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'healthy',
            checks: {
              database: { status: 'healthy', details: { latency: 8 } },
              providers: { status: 'healthy', details: { count: 0 } },
              reports: { status: 'healthy', details: { count: 0 } },
              activity: { status: 'healthy', details: { events: 0 } },
              system: { status: 'healthy', details: { categories: 17, areas: 11 } }
            }
          }),
        });
      }
      
      if (urlString.includes('/admin/settings/emergency-mode')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { enabled: true }, error: null }),
        });
      }
      
      return Promise.reject(new Error(`Unknown endpoint: ${urlString}`));
    });

    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('INACTIVE')).toBeInTheDocument();
    });

    const enableButton = screen.getByText('🚨 Enable Emergency Mode');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('cancels toggle when prompt is cancelled', async () => {
    global.prompt = vi.fn(() => null);

    render(<AdminSettings />);

    await waitFor(() => {
      const enableButton = screen.getByText('🚨 Enable Emergency Mode');
      fireEvent.click(enableButton);
    });

    // Should not make the API call
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/admin/settings/emergency-mode'),
      expect.any(Object)
    );
  });

  it('handles fetch error', async () => {
    // Override the mock to fail on emergency mode fetch
    fetchMock.mockImplementation((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : url.url;
      
      if (urlString.includes('/settings/emergency-mode') && !urlString.includes('/admin/')) {
        return Promise.reject(new Error('Network error'));
      }
      
      if (urlString.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'healthy',
            checks: {
              database: { status: 'healthy', details: { latency: 8 } },
              providers: { status: 'healthy', details: { count: 0 } },
              reports: { status: 'healthy', details: { count: 0 } },
              activity: { status: 'healthy', details: { events: 0 } },
              system: { status: 'healthy', details: { categories: 17, areas: 11 } }
            }
          }),
        });
      }
      
      return Promise.reject(new Error(`Unknown endpoint: ${urlString}`));
    });

    render(<AdminSettings />);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error fetching emergency mode status');
    });
  });

  it('handles toggle error', async () => {
    global.prompt = vi.fn(() => 'Test notes');
    
    // Override the mock to fail on admin endpoint
    fetchMock.mockImplementation((url: string | Request) => {
      const urlString = typeof url === 'string' ? url : url.url;
      
      if (urlString.includes('/settings/emergency-mode') && !urlString.includes('/admin/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { enabled: false }, error: null }),
        });
      }
      
      if (urlString.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'healthy',
            checks: {
              database: { status: 'healthy', details: { latency: 8 } },
              providers: { status: 'healthy', details: { count: 0 } },
              reports: { status: 'healthy', details: { count: 0 } },
              activity: { status: 'healthy', details: { events: 0 } },
              system: { status: 'healthy', details: { categories: 17, areas: 11 } }
            }
          }),
        });
      }
      
      if (urlString.includes('/admin/settings/emergency-mode')) {
        return Promise.reject(new Error('Network error'));
      }
      
      return Promise.reject(new Error(`Unknown endpoint: ${urlString}`));
    });

    render(<AdminSettings />);

    await waitFor(() => {
      const enableButton = screen.getByText('🚨 Enable Emergency Mode');
      fireEvent.click(enableButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error updating emergency mode');
    });
  });

  it('shows warning banner when emergency mode is enabled', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { enabled: true }, error: null }),
    });

    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Mode is Active')).toBeInTheDocument();
    });
  });

  it('has correct checkbox state', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('🚨 Enable Emergency Mode')).toBeInTheDocument();
    });
  });

  it('has correct checkbox state when enabled', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { enabled: true }, error: null }),
    });

    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('🔕 Disable Emergency Mode')).toBeInTheDocument();
    });
  });
});