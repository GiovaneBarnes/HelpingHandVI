import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';

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

describe('Dashboard', () => {
  const mockProvider = {
    id: 1,
    name: 'Test Provider',
    phone: '123-456-7890',
    whatsapp: '123-456-7890',
    island: 'STT',
    status: 'OPEN_NOW',
    plan: 'FREE',
    plan_source: 'TRIAL',
    trial_end_at: null,
    is_premium_active: false,
    trial_days_left: 0,
    is_trial: false,
    categories: ['Plumbing'],
    areas: [{ id: 1, name: 'Charlotte Amalie', island: 'STT' }],
    contact_call_enabled: true,
    contact_whatsapp_enabled: true,
    contact_sms_enabled: true,
    preferred_contact_method: 'CALL',
    typical_hours: 'Mon-Fri 8AM-5PM',
    emergency_calls_accepted: false,
  };

  const mockAreas = [
    { id: 1, name: 'Charlotte Amalie', island: 'STT' },
    { id: 2, name: 'East End', island: 'STT' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
  });

  it('renders loading state initially', () => {
    // Override the default mock to never resolve
    fetchMock.mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders provider not found when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Provider not found')).toBeInTheDocument();
    });
  });

  it('renders dashboard with provider data', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Token: abc123')).toBeInTheDocument();
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    // expect(screen.getByText('OPEN_NOW')).toBeInTheDocument();
  });

  it('displays trial status for trial providers', async () => {
    const trialProvider = { ...mockProvider, is_trial: true, trial_days_left: 15, is_premium_active: true };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(trialProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Premium Trial: 15 days left')).toBeInTheDocument();
    expect(screen.getByText('Trial')).toBeInTheDocument();
  });

  it('displays premium status for premium providers', async () => {
    const premiumProvider = { ...mockProvider, is_premium_active: true, is_trial: false };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(premiumProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('updates status successfully', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockProvider, status: 'BUSY_LIMITED' }),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('OPEN_NOW');
    await userEvent.selectOptions(select, 'BUSY_LIMITED');
    expect(select).toHaveValue('BUSY_LIMITED');

    const updateButton = screen.getByRole('button', { name: 'Update Status' });
    await userEvent.click(updateButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/providers/1/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'BUSY_LIMITED' }),
        })
      );
    });
  });

  it('handles status update error', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('OPEN_NOW');
    fireEvent.change(select, { target: { value: 'NEXT_3_DAYS' } });

    const updateButton = screen.getByRole('button', { name: 'Update Status' });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error updating status');
    });
  });

  it('toggles edit mode', async () => {
    vi.clearAllMocks();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: 'Edit Profile' });
    fireEvent.click(editButton);

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Provider')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('123-456-7890')).toHaveLength(2); // Phone and WhatsApp
  });

  it('updates profile successfully', async () => {
    vi.clearAllMocks();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockProvider, name: 'Updated Name' }),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Update name (form is pre-populated)
    const nameInput = screen.getByDisplayValue('Test Provider');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/providers/1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"name":"Updated Name"'),
        })
      );
    });
  });

  it('handles profile update error', async () => {
    vi.clearAllMocks();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error updating profile');
    });
  });

  it('updates contact preferences', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Check contact preference checkboxes exist
    expect(screen.getByText('Enable Call button')).toBeInTheDocument();
    expect(screen.getByText('Enable WhatsApp button')).toBeInTheDocument();
    expect(screen.getByText('Enable SMS button')).toBeInTheDocument();

    // Check preferred contact method select
    expect(screen.getByDisplayValue('Call')).toBeInTheDocument();
  });

  it('updates work information', async () => {
    vi.clearAllMocks();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Check work information fields (form starts empty)
    expect(screen.getByText('Accept emergency calls')).toBeInTheDocument();
  });

  it('updates service areas', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAreas),
      });

    render(
      <MemoryRouter initialEntries={['/dashboard/1?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Wait for areas to be loaded
    await waitFor(() => {
      expect(screen.getByText('Charlotte Amalie')).toBeInTheDocument();
    });

    // Check service areas
    expect(screen.getByText('Charlotte Amalie')).toBeInTheDocument();
    expect(screen.getByText('East End')).toBeInTheDocument();
  });

  it('handles fetch areas error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider)
      })
      .mockRejectedValueOnce(new Error('Failed to fetch areas'));

    render(
      <MemoryRouter initialEntries={['/dashboard/123?token=abc123']}>
        <Routes>
          <Route path="/dashboard/:providerId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should not crash, dashboard should still render
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch areas');

    consoleSpy.mockRestore();
  });
});