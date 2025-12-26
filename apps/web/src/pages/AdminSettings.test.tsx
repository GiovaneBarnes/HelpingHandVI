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

// Mock window.location
delete (global as any).window.location;
(global as any).window.location = { href: '' };

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Mock logged in
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: false, data: { enabled: false }, error: null }),
    });
  });

  it('renders admin settings page with title', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('Admin - Settings')).toBeInTheDocument();
    });
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

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays emergency mode status when disabled', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Mode: DISABLED')).toBeInTheDocument();
      expect(screen.getByText('Enable Emergency Mode')).toBeInTheDocument();
    });
  });

  it('displays emergency mode status when enabled', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: true, data: { enabled: true }, error: null }),
    });

    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Mode: ENABLED')).toBeInTheDocument();
      expect(screen.getByText('Disable Emergency Mode')).toBeInTheDocument();
      expect(screen.getByText('Active:')).toBeInTheDocument();
    });
  });

  it('handles emergency mode toggle to enable', async () => {
    global.prompt = vi.fn(() => 'Enabling emergency mode');

    render(<AdminSettings />);

    await waitFor(() => {
      const enableButton = screen.getByText('Enable Emergency Mode');
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
      const disableButton = screen.getByText('Disable Emergency Mode');
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

    // Mock initial status fetch (disabled)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { enabled: false }, error: null }),
    });
    // Mock toggle POST (enable)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { enabled: true }, error: null }),
    });

    render(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Mode: DISABLED')).toBeInTheDocument();
    });

    const enableButton = screen.getByText('Enable Emergency Mode');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText('Emergency Mode: ENABLED')).toBeInTheDocument();
    });
  });

  it('cancels toggle when prompt is cancelled', async () => {
    global.prompt = vi.fn(() => null);

    render(<AdminSettings />);

    await waitFor(() => {
      const enableButton = screen.getByText('Enable Emergency Mode');
      fireEvent.click(enableButton);
    });

    // Should not make the API call
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/admin/settings/emergency-mode'),
      expect.any(Object)
    );
  });

  it('handles fetch error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    render(<AdminSettings />);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error fetching emergency mode status');
    });
  });

  it('handles toggle error', async () => {
    global.prompt = vi.fn(() => 'Test notes');
    // First call succeeds (fetch status), second call fails (toggle)
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { enabled: false }, error: null }),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<AdminSettings />);

    await waitFor(() => {
      const enableButton = screen.getByText('Enable Emergency Mode');
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
      expect(screen.getByText(/Emergency mode is currently enabled/)).toBeInTheDocument();
    });
  });

  it('has correct checkbox state', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });

  it('has correct checkbox state when enabled', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { enabled: true }, error: null }),
    });

    render(<AdminSettings />);

    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });
});