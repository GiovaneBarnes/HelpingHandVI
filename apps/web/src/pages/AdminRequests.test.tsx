import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRequests } from './AdminRequests';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data for tests
const mockRequests = [
  {
    id: 1,
    provider_id: 1,
    provider_name: 'John Doe',
    field: 'name' as const,
    current_value: 'John Doe',
    requested_value: "John Doe's Plumbing",
    reason: 'Want to make business name more professional',
    status: 'pending' as const,
    created_at: '2024-01-15T10:00:00Z',
    reviewed_at: undefined,
    reviewed_by: undefined,
  },
  {
    id: 2,
    provider_id: 2,
    provider_name: 'Jane Smith',
    field: 'island' as const,
    current_value: 'STT',
    requested_value: 'STJ',
    reason: 'Moved to St. John and need to update location',
    status: 'pending' as const,
    created_at: '2024-01-16T14:30:00Z',
    reviewed_at: undefined,
    reviewed_by: undefined,
  },
  {
    id: 3,
    provider_id: 3,
    provider_name: 'Bob Johnson',
    field: 'name' as const,
    current_value: 'Bob Johnson',
    requested_value: 'Bob Johnson Services',
    reason: 'Better branding',
    status: 'approved' as const,
    created_at: '2024-01-14T09:00:00Z',
    reviewed_at: '2024-01-14T10:00:00Z',
    reviewed_by: 'Admin',
  },
  {
    id: 4,
    provider_id: 4,
    provider_name: 'Alice Brown',
    field: 'island' as const,
    current_value: 'STX',
    requested_value: 'STT',
    reason: 'Incorrect location',
    status: 'rejected' as const,
    created_at: '2024-01-13T11:00:00Z',
    reviewed_at: '2024-01-13T12:00:00Z',
    reviewed_by: 'Admin',
  },
];

describe('AdminRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Admin is logged in
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    // Reset mock data to initial state
    mockRequests.length = 0;
    mockRequests.push(
      {
        id: 1,
        provider_id: 1,
        provider_name: 'John Doe',
        field: 'name' as const,
        current_value: 'John Doe',
        requested_value: "John Doe's Plumbing",
        reason: 'Want to make business name more professional',
        status: 'pending' as const,
        created_at: '2024-01-15T10:00:00Z',
        reviewed_at: undefined,
        reviewed_by: undefined,
      },
      {
        id: 2,
        provider_id: 2,
        provider_name: 'Jane Smith',
        field: 'island' as const,
        current_value: 'STT',
        requested_value: 'STJ',
        reason: 'Moved to St. John and need to update location',
        status: 'pending' as const,
        created_at: '2024-01-16T14:30:00Z',
        reviewed_at: undefined,
        reviewed_by: undefined,
      }
    );

    // Mock fetch for API calls
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/admin/change-requests') && (!options || !options.method || options.method === 'GET')) {
        // GET requests for fetching requests
        let filteredRequests = mockRequests;

        if (url.includes('status=pending')) {
          filteredRequests = mockRequests.filter(req => req.status === 'pending');
        } else if (url.includes('status=approved')) {
          filteredRequests = mockRequests.filter(req => req.status === 'approved');
        } else if (url.includes('status=rejected')) {
          filteredRequests = mockRequests.filter(req => req.status === 'rejected');
        }
        // If status is empty or 'all', return all requests

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ requests: filteredRequests }),
        });
      } else if (url.includes('/admin/change-requests/') && options?.method === 'PATCH') {
        // PATCH requests for approve/reject
        const requestId = parseInt(url.split('/').pop() || '0');
        const body = options.body as string;
        const { action } = JSON.parse(body);

        // Update the mock data
        const requestIndex = mockRequests.findIndex(req => req.id === requestId);
        if (requestIndex !== -1) {
          mockRequests[requestIndex].status = action === 'approve' ? 'approved' : 'rejected';
          mockRequests[requestIndex].reviewed_at = new Date().toISOString();
          mockRequests[requestIndex].reviewed_by = 'Admin';
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }

      return Promise.reject(new Error('Unexpected fetch call'));
    });
  });

  it('redirects to login if not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null); // Not logged in

    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('renders loading state initially', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading initially
    expect(screen.getByText('Loading requests...')).toBeInTheDocument();

    // Then it should load the data
    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });
  });

  it('renders requests after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('Requests').length).toBeGreaterThan(0);
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows pending filter by default', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    const pendingButton = screen.getByText('Pending (2)');
    expect(pendingButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('filters requests by status', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    // Initially shows 2 pending requests
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Click approved filter (should show 0)
    const approvedButton = screen.getByText('Approved (0)');
    fireEvent.click(approvedButton);

    await waitFor(() => {
      expect(screen.getByText('No approved requests found')).toBeInTheDocument();
    });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('approves a request', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    // Find approve button for first request
    const approveButtons = screen.getAllByText('✅ Approve Request');
    fireEvent.click(approveButtons[0]);

    // Check that the approve action was attempted
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/change-requests/1'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('rejects a request', async () => {
    // Mock window.prompt
    const mockPrompt = vi.fn(() => 'Test rejection reason');
    window.prompt = mockPrompt;

    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    // Find reject button for first request
    const rejectButtons = screen.getAllByText('❌ Reject Request');
    fireEvent.click(rejectButtons[0]);

    // Check that prompt was called
    expect(mockPrompt).toHaveBeenCalledWith('Optional notes for rejection:');

    // Check that the reject action was attempted
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/change-requests/1'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('shows request details correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    // Check business name change details
    expect(screen.getByText('Business Name Change Request')).toBeInTheDocument();
    const currentLabels = screen.getAllByText('Current');
    expect(currentLabels.length).toBeGreaterThan(0);
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements.length).toBeGreaterThan(0); // This appears in the header and details
    expect(screen.getByText("John Doe's Plumbing")).toBeInTheDocument();
    expect(screen.getByText('Want to make business name more professional')).toBeInTheDocument();

    // Check location change details
    expect(screen.getByText('Location Change Request')).toBeInTheDocument();
    expect(screen.getByText('STT')).toBeInTheDocument();
    expect(screen.getByText('STJ')).toBeInTheDocument();
    expect(screen.getByText('Moved to St. John and need to update location')).toBeInTheDocument();
  });

  it('shows all filter correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    // Click all filter
    const allButton = screen.getByText('All (2)');
    fireEvent.click(allButton);

    expect(allButton).toHaveClass('bg-blue-600', 'text-white');
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('logs out and redirects to login', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_logged_in');
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('shows navigation links', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading requests...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Providers')).toBeInTheDocument();
    const requestsElements = screen.getAllByText('Requests');
    expect(requestsElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});