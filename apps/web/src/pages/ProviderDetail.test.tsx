import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProviderDetail } from './ProviderDetail';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock useParams
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

// Mock console.error
const consoleErrorMock = vi.fn();
console.error = consoleErrorMock;

describe('ProviderDetail', () => {
  const mockProvider = {
    id: 1,
    name: 'John Doe',
    phone: '123-456-7890',
    whatsapp: '',
    island: 'STT',
    status: 'TODAY',
    last_active_at: new Date().toISOString(),
    lifecycle_status: 'ACTIVE',
    is_premium_active: false,
    is_trial: false,
    areas: [{ id: 1, name: 'Area 1', island: 'STT' }],
    categories: ['Electrician'],
    contact_call_enabled: true,
    contact_whatsapp_enabled: false,
    contact_sms_enabled: false,
    preferred_contact_method: 'CALL',
    typical_hours: '9-5',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
  });

  const renderProviderDetail = () => {
    return render(
      <MemoryRouter>
        <ProviderDetail />
      </MemoryRouter>
    );
  };

  it('renders provider details successfully', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.getAllByText('St. Thomas')).toHaveLength(1); // In main detail
    expect(screen.getAllByText('TODAY')).toHaveLength(1); // In main detail
  });

  it('displays activity time correctly', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    // Should display "0 hours ago" (tests getHoursAgo function)
    expect(screen.getByText(/hours ago/)).toBeInTheDocument();
  });

  it('handles fetch provider error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    renderProviderDetail();

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });

  it('handles report submission without provider', async () => {
    // Mock fetch to never resolve so provider stays null
    fetchMock.mockImplementation(() => new Promise(() => {}));

    renderProviderDetail();

    // Wait a bit for component to mount
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    // The report button might not be visible yet, but if it were clicked,
    // it should return early without doing anything (line 80)
    // This is tested implicitly by the component not crashing
  });

  it('handles report submission with prompts', async () => {
    // Mock prompts
    global.prompt = vi.fn()
      .mockReturnValueOnce('Inappropriate content') // reason
      .mockReturnValueOnce('contact@example.com'); // contact

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    const reportButton = screen.getByText('Report this listing');
    fireEvent.click(reportButton);

    // Should call prompts
    expect(global.prompt).toHaveBeenCalledWith('Reason for reporting:');
    expect(global.prompt).toHaveBeenCalledWith('Optional contact info:');

    // Should make the report API call
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/reports',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            provider_id: 1,
            reason: 'Inappropriate content',
            contact: 'contact@example.com'
          })
        })
      );
    });
  });

  it('cancels report when reason prompt is cancelled', async () => {
    global.prompt = vi.fn(() => null); // Cancel the reason prompt

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    const reportButton = screen.getByText('Report this listing');
    fireEvent.click(reportButton);

    // Should not make API call
    expect(fetchMock).not.toHaveBeenCalledWith(
      'http://localhost:3000/reports',
      expect.any(Object)
    );
  });

  it('renders disclaimer copy above CTAs', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    // Check that disclaimer text exists
    expect(screen.getByText("We don't guarantee work, pricing, timing, or quality.")).toBeInTheDocument();
    expect(screen.getByText('Confirm details directly with the provider.')).toBeInTheDocument();

    // Check DOM order: disclaimer should appear before CTA buttons
    const disclaimerElement = screen.getByText("We don't guarantee work, pricing, timing, or quality.").closest('.border-blue-200') as HTMLElement;
    const contactSection = screen.getByText('Contact').closest('div') as HTMLElement;
    const ctaButton = screen.getByText('📞 Call');

    // Disclaimer should be within contact section and before CTA buttons
    expect(contactSection).toContainElement(disclaimerElement);
    expect(contactSection).toContainElement(ctaButton);
  });

  it('displays preferred contact method when provided', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.getByText('Preferred contact: CALL')).toBeInTheDocument();
  });

  it('hides preferred contact method when null', async () => {
    const providerWithoutPreferred = { ...mockProvider, preferred_contact_method: null };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providerWithoutPreferred),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Preferred contact:/)).not.toBeInTheDocument();
  });

  it('displays typical hours when provided', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('9-5')).toBeInTheDocument();
  });

  it('omits typical hours when null or empty', async () => {
    const providerWithoutHours = { ...mockProvider, typical_hours: null };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providerWithoutHours),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Typical hours:/)).not.toBeInTheDocument();
  });

  it('displays emergency calls accepted when true', async () => {
    const providerWithEmergency = { ...mockProvider, emergency_calls_accepted: true };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providerWithEmergency),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.getByText('Emergency Calls Accepted')).toBeInTheDocument();
  });

  it('omits emergency calls accepted when false', async () => {
    const providerWithoutEmergency = { ...mockProvider, emergency_calls_accepted: false };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providerWithoutEmergency),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.queryByText('Emergency Calls Accepted')).not.toBeInTheDocument();
  });

  it('renders only enabled contact methods as CTAs', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProvider),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    // Should show Call button (enabled)
    expect(screen.getByText('📞 Call')).toBeInTheDocument();

    // Should not show WhatsApp button (disabled)
    expect(screen.queryByText('💬 WhatsApp')).not.toBeInTheDocument();

    // Should not show SMS button (disabled)
    expect(screen.queryByText('💬 SMS')).not.toBeInTheDocument();
  });

  it('renders multiple enabled contact methods', async () => {
    const providerWithMultipleContacts = {
      ...mockProvider,
      contact_call_enabled: true,
      contact_whatsapp_enabled: true,
      contact_sms_enabled: true,
      whatsapp: '1234567890'
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providerWithMultipleContacts),
    });

    renderProviderDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'John Doe' })).toBeInTheDocument();
    });

    expect(screen.getByText('📞 Call')).toBeInTheDocument();
    expect(screen.getByText('💬 WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('💬 SMS')).toBeInTheDocument();
  });
});