import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AdminProviders } from './AdminProviders';

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
  };
});

describe('AdminProviders', () => {
  const mockCategories = [
    { id: 1, name: 'Electrician' },
    { id: 2, name: 'Plumber' },
  ];

  const mockAreas = [
    { id: 1, name: 'Charlotte Amalie' },
    { id: 2, name: 'Red Hook' },
  ];

  const mockProviders = [
    {
      id: 1,
      name: 'John Doe',
      phone: '123-456-7890',
      island: 'STT',
      status: 'OPEN_NOW',
      archived: false,
      badges: ['VERIFIED'],
      is_disputed: false,
      disputed_at: null,
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone: '098-765-4321',
      island: 'STJ',
      status: 'BUSY_LIMITED',
      archived: true,
      badges: [],
      is_disputed: true,
      disputed_at: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Mock logged in
    
    // Mock all fetch calls
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAreas),
        });
      }
      if (url.includes('/admin/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProviders),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  const renderAdminProviders = () => {
    return render(
      <MemoryRouter>
        <AdminProviders />
      </MemoryRouter>
    );
  };

  it('renders admin providers page with title', async () => {
    renderAdminProviders();

    await waitFor(() => {
      const titleElement = screen.getByRole('heading', { level: 2, name: 'Providers' });
      expect(titleElement).toBeInTheDocument();
    });
    await waitFor(() => {
      // Check for provider in table, not in dropdown
      const tableRows = screen.getAllByText('John Doe');
      expect(tableRows.length).toBeGreaterThan(0);
    });
  });

  it('redirects to login if not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);

    renderAdminProviders();

    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('fetches providers on mount', async () => {
    renderAdminProviders();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/providers?',
        expect.objectContaining({
          headers: { 'X-ADMIN-KEY': 'admin-secret' },
        })
      );
    });
  });

  it('displays loading state initially', () => {
    renderAdminProviders();

    expect(screen.getByText('Loading providers...')).toBeInTheDocument();
  });

  it('displays providers in table', async () => {
    renderAdminProviders();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      expect(screen.getAllByText('St. Thomas')).toHaveLength(2); // One in select, one in table
      expect(screen.getByText('OPEN NOW')).toBeInTheDocument();
      expect(screen.getByText('VERIFIED')).toBeInTheDocument();
    });
  });

  it('displays archived status correctly', async () => {
    renderAdminProviders();

    await waitFor(() => {
      // Jane Smith should have archived badge
      const archivedBadges = screen.getAllByText('Archived');
      expect(archivedBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays disputed badge for disputed providers', async () => {
    renderAdminProviders();

    await waitFor(() => {
      const disputedBadges = screen.getAllByText('Disputed');
      expect(disputedBadges.length).toBeGreaterThan(0);
    });
  });

  it('handles filter changes', async () => {
    renderAdminProviders();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2); // categories + providers
    });

    await waitFor(() => {
      const islandSelect = screen.getByDisplayValue('All Islands');
      fireEvent.change(islandSelect, { target: { value: 'STT' } });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4); // categories + providers (twice due to filter change)
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('island=STT'),
        expect.any(Object)
      );
    });
  });

  it('handles multiple filter changes', async () => {
    renderAdminProviders();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2); // categories + providers
    });

    // Change island filter
    await waitFor(() => {
      const islandSelect = screen.getByDisplayValue('All Islands');
      fireEvent.change(islandSelect, { target: { value: 'STT' } });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4); // categories + providers (multiple times due to filter changes)
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('island=STT'),
        expect.any(Object)
      );
    });

    // Change category filter
    await waitFor(() => {
      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('island=STT&categoryId=1'),
        expect.any(Object)
      );
    });
  });

  it('handles verify action', async () => {
    // Mock prompt
    global.prompt = vi.fn(() => 'Test notes');

    renderAdminProviders();

    await waitFor(() => {
      expect(screen.getAllByText('Verify')[0]).toBeInTheDocument();
    });

    const verifyButton = screen.getAllByText('Verify')[0];
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/providers/1/verify',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ notes: 'Test notes' }),
        })
      );
    });
  });

  it('handles archive action', async () => {
    renderAdminProviders();

    await waitFor(() => {
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });

    const archiveButton = screen.getByText('Archive');
    fireEvent.click(archiveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/providers/1/archive',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  it('handles unarchive action for archived providers', async () => {
    renderAdminProviders();

    await waitFor(() => {
      expect(screen.getByText('Unarchive')).toBeInTheDocument();
    });

    const unarchiveButton = screen.getByText('Unarchive');
    fireEvent.click(unarchiveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/providers/2/archive',
        expect.any(Object)
      );
    });
  });

  it('handles mark disputed action', async () => {
    global.prompt = vi.fn(() => 'Dispute notes');

    renderAdminProviders();

    await waitFor(() => {
      expect(screen.getByText('Flag')).toBeInTheDocument();
    });

    const disputeButton = screen.getByText('Flag');
    fireEvent.click(disputeButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/providers/1/disputed',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isDisputed: true, notes: 'Dispute notes' }),
        })
      );
    });
  });

  it('handles unmark disputed action', async () => {
    global.prompt = vi.fn(() => 'Resolve notes');

    renderAdminProviders();

    await waitFor(() => {
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });

    const undisputeButton = screen.getByText('Resolve');
    fireEvent.click(undisputeButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/admin/providers/2/disputed',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isDisputed: false, notes: 'Resolve notes' }),
        })
      );
    });
  });

  it('handles fetch error', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/admin/providers')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    renderAdminProviders();

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error fetching providers');
    });
  });

  it('cancels verify when prompt is cancelled', async () => {
    global.prompt = vi.fn(() => null);

    renderAdminProviders();

    await waitFor(() => {
      const verifyButton = screen.getAllByText('Verify')[0];
      fireEvent.click(verifyButton);
    });

    // Should not make the API call
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/verify'),
      expect.any(Object)
    );
  });

  it('cancels disputed action when prompt is cancelled', async () => {
    global.prompt = vi.fn(() => null);

    renderAdminProviders();

    await waitFor(() => {
      const disputeButton = screen.getByText('Flag');
      fireEvent.click(disputeButton);
    });

    // Should not make the API call
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/disputed'),
      expect.any(Object)
    );
  });

  it('handles verify error', async () => {
    // Mock prompt
    global.prompt = vi.fn(() => 'Test notes');

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/verify')) {
        return Promise.reject(new Error('Network error'));
      }
      if (url.includes('/admin/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProviders),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    renderAdminProviders();

    await waitFor(() => {
      // Check for provider in table
      const tableRows = screen.getAllByText('John Doe');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    const verifyButton = screen.getAllByText('Verify')[0];
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error verifying');
    });
  });

  it('handles archive error', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/archive')) {
        return Promise.reject(new Error('Network error'));
      }
      if (url.includes('/admin/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProviders),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    renderAdminProviders();

    await waitFor(() => {
      // Check for provider in table
      const tableRows = screen.getAllByText('John Doe');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    const archiveButton = screen.getAllByText('Archive')[0];
    fireEvent.click(archiveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error updating');
    });
  });

  it('handles disputed error', async () => {
    // Mock prompt
    global.prompt = vi.fn(() => 'Test notes');

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/disputed')) {
        return Promise.reject(new Error('Network error'));
      }
      if (url.includes('/admin/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProviders),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    renderAdminProviders();

    await waitFor(() => {
      // Check for provider in table
      const tableRows = screen.getAllByText('John Doe');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    const disputedButton = screen.getAllByText('Flag')[0];
    fireEvent.click(disputedButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error updating disputed status');
    });
  });

  it('handles fetch providers error', async () => {
    localStorageMock.getItem.mockReturnValue('true');

    // Mock categories success, providers failure
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/admin/providers')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    renderAdminProviders();

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error fetching providers');
    });
  });
});