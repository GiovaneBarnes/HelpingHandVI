import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProviderDetail } from '../pages/ProviderDetail';

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

// Mock prompt
global.prompt = vi.fn();

describe('ProviderDetail', () => {
  const mockProvider = {
    id: 1,
    name: 'Test Provider',
    phone: '123-456-7890',
    whatsapp: '123-456-7890',
    island: 'STT',
    profile: {},
    status: 'TODAY',
    last_active_at: '2024-01-01T12:00:00Z',
    plan: 'FREE',
    is_premium_active: false,
    is_trial: false,
    contact_call_enabled: true,
    contact_whatsapp_enabled: true,
    contact_sms_enabled: true,
    preferred_contact_method: 'CALL',
    typical_hours: 'Mon-Fri 8AM-5PM',
    emergency_calls_accepted: true,
    areas: [
      { id: 1, name: 'Charlotte Amalie', island: 'STT' },
      { id: 2, name: 'East End', island: 'STT' },
    ],
  };

  beforeEach(() => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/providers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProvider),
        });
      } else if (url.includes('/reports')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Override the default mock to never resolve
    fetchMock.mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders provider not found when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Provider not found')).toBeInTheDocument();
    });
  });

  it('renders provider details successfully', async () => {
    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Provider')).toBeInTheDocument();
    expect(screen.getByText('STT')).toBeInTheDocument();
    expect(screen.getByText('TODAY')).toBeInTheDocument();
    expect(screen.getByText('Preferred contact: CALL')).toBeInTheDocument();
  });

  it('displays premium status for premium providers', async () => {
    const premiumProvider = { ...mockProvider, is_premium_active: true, is_trial: false };

    fetchMock.mockImplementationOnce((url: string) => {
      if (url.includes('/providers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(premiumProvider),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('displays trial status for trial providers', async () => {
    const trialProvider = { ...mockProvider, is_premium_active: true, is_trial: true };

    fetchMock.mockImplementationOnce((url: string) => {
      if (url.includes('/providers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(trialProvider),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Trial')).toBeInTheDocument();
  });

  it('displays service areas', async () => {
    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Charlotte Amalie')).toBeInTheDocument();
    expect(screen.getByText('East End')).toBeInTheDocument();
  });

  it('displays hours and emergency calls badge', async () => {
    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Mon-Fri 8AM-5PM')).toBeInTheDocument();
    expect(screen.getByText('Emergency Calls Accepted')).toBeInTheDocument();
  });

  it('shows contact buttons when enabled', async () => {
    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('📞 Call')).toBeInTheDocument();
    expect(screen.getByText('💬 WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('💬 SMS')).toBeInTheDocument();
  });

  it('hides WhatsApp button when not enabled', async () => {
    const providerNoWhatsApp = { ...mockProvider, contact_whatsapp_enabled: false };

    fetchMock.mockImplementationOnce((url: string) => {
      if (url.includes('/providers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(providerNoWhatsApp),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('📞 Call')).toBeInTheDocument();
    expect(screen.queryByText('💬 WhatsApp')).not.toBeInTheDocument();
    expect(screen.getByText('💬 SMS')).toBeInTheDocument();
  });

  it('submits report successfully', async () => {
    (global.prompt as any)
      .mockReturnValueOnce('Test reason')
      .mockReturnValueOnce('test@example.com');

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const reportButton = screen.getByText('Report this listing');
    fireEvent.click(reportButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/reports',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            provider_id: 1,
            reason: 'Test reason',
            contact: 'test@example.com',
          }),
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith('Report submitted');
  });

  it('cancels report when reason is empty', async () => {
    (global.prompt as any).mockReturnValueOnce('');

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const reportButton = screen.getByText('Report this listing');
    fireEvent.click(reportButton);

    expect(global.prompt).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/reports'),
      expect.any(Object)
    );
  });

  it('handles report submission error', async () => {
    (global.prompt as any)
      .mockReturnValueOnce('Test reason')
      .mockReturnValueOnce('test@example.com');

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/providers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProvider),
        });
      } else if (url.includes('/reports')) {
        return Promise.reject(new Error('Failed to submit'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const reportButton = screen.getByText('Report this listing');
    fireEvent.click(reportButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error submitting report');
    });
  });

  it('displays activity time correctly', async () => {
    const recentProvider = {
      ...mockProvider,
      last_active_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    };

    fetchMock.mockImplementationOnce((url: string) => {
      if (url.includes('/providers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(recentProvider),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Profile activity: 5 hours ago')).toBeInTheDocument();
  });

  it('displays never active for null last_active_at', async () => {
    const inactiveProvider = { ...mockProvider, last_active_at: null };

    fetchMock.mockImplementationOnce((url: string) => {
      if (url.includes('/providers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(inactiveProvider),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter initialEntries={['/provider/1']}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Profile activity: Never')).toBeInTheDocument();
  });
});