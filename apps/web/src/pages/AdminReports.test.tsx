import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AdminReports } from './AdminReports';

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

// Mock alert and confirm
global.alert = vi.fn();
global.confirm = vi.fn();

// Mock window.location
delete (global as any).window.location;
(global as any).window.location = { href: '' };

describe('AdminReports', () => {
  const mockReports = [
    {
      id: 1,
      provider_id: 1,
      provider_name: 'John Doe',
      reason: 'Wrong information',
      contact: 'john@example.com',
      created_at: '2024-01-01T00:00:00Z',
      report_type: 'WRONG_NUMBER',
      status: 'NEW',
      admin_notes: '',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      provider_id: 2,
      provider_name: 'Jane Smith',
      reason: 'Not in business',
      contact: '',
      created_at: '2024-01-02T00:00:00Z',
      report_type: 'NOT_IN_BUSINESS',
      status: 'IN_REVIEW',
      admin_notes: 'Checking status',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Mock logged in
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReports),
    });
    (global.confirm as any).mockReturnValue(true);
  });

  it('renders admin reports page with title', async () => {
    render(<AdminReports />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Admin - Reports')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('redirects to login if not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<AdminReports />);

    expect(window.location.href).toBe('/admin/login');
  });

  it('fetches reports on mount', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/reports?',
        expect.objectContaining({
          headers: { 'X-ADMIN-KEY': 'admin-secret' },
        })
      );
    });
  });

  it('displays loading state initially', () => {
    render(<AdminReports />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays reports in table', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('WRONG_NUMBER')).toBeInTheDocument();
      expect(screen.getByText('Wrong information')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('displays N/A for missing contact', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  it('handles filter changes', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      const statusSelect = screen.getByDisplayValue('All Status (default: NEW + IN_REVIEW)');
      fireEvent.change(statusSelect, { target: { value: 'NEW' } });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/reports?status=NEW',
        expect.any(Object)
      );
    });
  });

  it('handles multiple filter changes', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Change status filter
    await waitFor(() => {
      const statusSelect = screen.getByDisplayValue('All Status (default: NEW + IN_REVIEW)');
      fireEvent.change(statusSelect, { target: { value: 'NEW' } });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/reports?status=NEW',
        expect.any(Object)
      );
    });

    // Change type filter
    await waitFor(() => {
      const typeSelect = screen.getByDisplayValue('All Types');
      fireEvent.change(typeSelect, { target: { value: 'WRONG_NUMBER' } });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/reports?status=NEW&type=WRONG_NUMBER',
        expect.any(Object)
      );
    });
  });

  it('handles status change', async () => {
    global.prompt = vi.fn(() => 'Updated status');

    render(<AdminReports />);

    await waitFor(() => {
      const statusSelect = screen.getAllByDisplayValue('New')[0];
      fireEvent.change(statusSelect, { target: { value: 'IN_REVIEW' } });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/reports/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'IN_REVIEW', adminNotes: 'Updated status' }),
        })
      );
    });
  });

  it('handles archive provider action', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      const archiveButton = screen.getAllByText('Archive Provider')[0];
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/providers/1/archive',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  it('cancels archive when confirm is rejected', async () => {
    (global.confirm as any).mockReturnValue(false);

    render(<AdminReports />);

    await waitFor(() => {
      const archiveButton = screen.getAllByText('Archive Provider')[0];
      fireEvent.click(archiveButton);
    });

    // Should not make the API call
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/archive'),
      expect.any(Object)
    );
  });

  it('cancels status change when prompt is cancelled', async () => {
    global.prompt = vi.fn(() => null);

    render(<AdminReports />);

    await waitFor(() => {
      const statusSelect = screen.getAllByDisplayValue('New')[0];
      fireEvent.change(statusSelect, { target: { value: 'IN_REVIEW' } });
    });

    // Should not make the API call
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/admin/reports/'),
      expect.any(Object)
    );
  });

  it('handles fetch error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    render(<AdminReports />);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error fetching reports');
    });
  });

  it('shows success alert after archiving', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      const archiveButton = screen.getAllByText('Archive Provider')[0];
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Provider archived');
    });
  });

  it('handles status change error', async () => {
    global.prompt = vi.fn(() => 'Notes');
    // Mock fetch to succeed for reports fetch, fail for status change
    fetchMock.mockImplementation((url) => {
      if (url.includes('/admin/reports?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReports),
        });
      } else {
        return Promise.reject(new Error('Network error'));
      }
    });

    render(<AdminReports />);

    await waitFor(() => {
      const statusSelect = screen.getAllByDisplayValue('New')[0];
      fireEvent.change(statusSelect, { target: { value: 'IN_REVIEW' } });
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error updating report status');
    });
  });

  it('handles archive error', async () => {
    // Mock fetch to succeed for reports fetch, fail for archive
    fetchMock.mockImplementation((url) => {
      if (url.includes('/admin/reports?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReports),
        });
      } else {
        return Promise.reject(new Error('Network error'));
      }
    });

    render(<AdminReports />);

    await waitFor(() => {
      const archiveButton = screen.getAllByText('Archive Provider')[0];
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error archiving');
    });
  });

  it('handles fetch reports error', async () => {
    localStorageMock.getItem.mockReturnValue('true');

    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    render(<AdminReports />);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error fetching reports');
    });
  });
});