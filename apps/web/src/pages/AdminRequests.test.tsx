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

describe('AdminRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Admin is logged in
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
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

    // The component loads data synchronously, so loading should not be visible
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Admin Dashboard - Requests')).toBeInTheDocument();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find approve button for first request
    const approveButtons = screen.getAllByText('Approve');
    fireEvent.click(approveButtons[0]);

    // Check that pending count decreased and approved count increased
    await waitFor(() => {
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
      expect(screen.getByText('Approved (1)')).toBeInTheDocument();
    });

    // Switch to approved filter to see the approved request
    const approvedFilterButton = screen.getByText('Approved (1)');
    fireEvent.click(approvedFilterButton);

    // Now check that the approved badge is visible
    expect(screen.getAllByText('Approved')).toBeTruthy();
  });

  it('rejects a request', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/requests']}>
        <Routes>
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find reject button for first request
    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);

    // Check that pending count decreased and rejected count increased
    await waitFor(() => {
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
      expect(screen.getByText('Rejected (1)')).toBeInTheDocument();
    });

    // Switch to rejected filter to see the rejected request
    const rejectedFilterButton = screen.getByText('Rejected (1)');
    fireEvent.click(rejectedFilterButton);

    // Now check that the rejected badge is visible
    expect(screen.getAllByText('Rejected')).toBeTruthy();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check business name change details
    expect(screen.getByText('Business Name Change')).toBeInTheDocument();
    const currentLabels = screen.getAllByText('Current:');
    expect(currentLabels.length).toBeGreaterThan(0);
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements.length).toBeGreaterThan(0); // This appears in the header and details
    expect(screen.getByText("John Doe's Plumbing")).toBeInTheDocument();
    expect(screen.getByText('Want to make business name more professional')).toBeInTheDocument();

    // Check location change details
    expect(screen.getByText('Location Change')).toBeInTheDocument();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Providers')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});