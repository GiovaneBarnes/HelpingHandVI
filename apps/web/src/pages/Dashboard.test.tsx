import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Dashboard } from './Dashboard';

// Mock alert
global.alert = vi.fn();

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock useParams and useSearchParams
const mockUseParams = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
});

describe('Dashboard', () => {
  const mockProvider = {
    id: 1,
    name: 'John Doe',
    phone: '123-456-7890',
    whatsapp: '',
    island: 'STT',
    status: 'TODAY',
    plan: 'FREE',
    plan_source: 'FREE',
    is_premium_active: false,
    trial_days_left: 0,
    is_trial: false,
    categories: ['Electrician'],
    areas: [{ id: 1, name: 'Area 1', island: 'STT' }],
    contact_call_enabled: true,
    contact_whatsapp_enabled: false,
    contact_sms_enabled: false,
    preferred_contact_method: 'CALL',
    typical_hours: '9-5',
    emergency_calls_accepted: false,
  };

  const mockAreas = [
    { id: 1, name: 'Area 1', island: 'STT' },
    { id: 2, name: 'Area 2', island: 'STT' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ providerId: '1' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('token=test-token')]);
  });

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  };

  it('renders dashboard with provider data', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/providers/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProvider),
        });
      } else if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAreas),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('TODAY')).toBeInTheDocument();
    });
  });

  it('handles area checkbox changes', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/providers/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProvider),
        });
      } else if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAreas),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('TODAY')).toBeInTheDocument();
    });

    // Click edit button to show form
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Service Areas')).toBeInTheDocument();
    });

    // Find and click the area checkbox
    const areaCheckbox = screen.getByLabelText('Area 1');
    expect(areaCheckbox).toBeChecked();
    fireEvent.click(areaCheckbox);
    expect(areaCheckbox).not.toBeChecked();
  });
});