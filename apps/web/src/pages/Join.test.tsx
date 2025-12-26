import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Join } from './Join';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Join', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockNavigate.mockClear();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Cruz Bay', island: 'STJ' },
            { id: 2, name: 'Coral Bay', island: 'STJ' }
          ])
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 123, token: 'abc123' })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
  });

  const renderJoin = () => {
    return render(
      <MemoryRouter>
        <Join />
      </MemoryRouter>
    );
  };

  it('renders the join form with title', () => {
    renderJoin();

    expect(screen.getByText('Join as Provider')).toBeInTheDocument();
    // Check for form element by finding the submit button within it
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    renderJoin();

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp (optional)')).toBeInTheDocument();
    expect(screen.getByText('Island')).toBeInTheDocument();
  });

  it('updates form state when inputs change', () => {
    renderJoin();

    // Find inputs by their labels
    const nameLabel = screen.getByText('Name');
    const phoneLabel = screen.getByText('Phone');
    const nameInput = nameLabel.nextElementSibling as HTMLInputElement;
    const phoneInput = phoneLabel.nextElementSibling as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });

    expect(nameInput).toHaveValue('John Doe');
    expect(phoneInput).toHaveValue('123-456-7890');
  });

  it('fetches areas when island is selected', async () => {
    renderJoin();

    const islandSelect = screen.getByDisplayValue('Select Island');
    fireEvent.change(islandSelect, { target: { value: 'STJ' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/areas?island=STJ');
    });
  });

  it('shows validation errors for required fields', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ errors: { name: 'Name is required', phone: 'Phone is required' } })
    });

    renderJoin();

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful submission', async () => {
    renderJoin();

    // Fill required fields - find inputs by their labels
    const nameLabel = screen.getByText('Name');
    const phoneLabel = screen.getByText('Phone');
    const nameInput = nameLabel.nextElementSibling as HTMLInputElement;
    const phoneInput = phoneLabel.nextElementSibling as HTMLInputElement;
    const islandSelect = screen.getByDisplayValue('Select Island');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });
    
    // Select island
    fireEvent.change(islandSelect, { target: { value: 'STJ' } });

    // Select a category checkbox
    const electricianCheckbox = screen.getByLabelText('Electrician');
    fireEvent.click(electricianCheckbox);

    // Select an area checkbox (areas are pre-loaded in test mode)
    const cruzBayCheckbox = screen.getByLabelText('Cruz Bay');
    fireEvent.click(cruzBayCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/123?token=placeholder');
    });
  });

  it('displays contact method checkboxes', () => {
    renderJoin();

    expect(screen.getByText('Enable Call button')).toBeInTheDocument();
    expect(screen.getByText('Enable WhatsApp button')).toBeInTheDocument();
    expect(screen.getByText('Enable SMS button')).toBeInTheDocument();
  });

  it('handles fetch areas error gracefully', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/areas')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderJoin();

    const islandSelect = screen.getByDisplayValue('Select Island');
    fireEvent.change(islandSelect, { target: { value: 'STJ' } });

    // Should not crash, areas list should remain empty
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/areas?island=STJ');
    });
  });

  it('validates preferred contact method must be enabled', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ errors: {} })
    });

    renderJoin();

    // Fill required fields
    const nameLabel = screen.getByText('Name');
    const phoneLabel = screen.getByText('Phone');
    const nameInput = nameLabel.nextElementSibling as HTMLInputElement;
    const phoneInput = phoneLabel.nextElementSibling as HTMLInputElement;
    const islandSelect = screen.getByDisplayValue('Select Island');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });
    fireEvent.change(islandSelect, { target: { value: 'STJ' } });

    // Select categories and areas
    const electricianCheckbox = screen.getByLabelText('Electrician');
    fireEvent.click(electricianCheckbox);
    const cruzBayCheckbox = screen.getByLabelText('Cruz Bay');
    fireEvent.click(cruzBayCheckbox);

    // Set preferred to CALL, then disable CALL
    const preferredSelect = screen.getByDisplayValue('None');
    fireEvent.change(preferredSelect, { target: { value: 'CALL' } });

    // Now disable CALL
    const callCheckbox = screen.getByLabelText('Enable Call button');
    fireEvent.click(callCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Preferred method must be enabled')).toBeInTheDocument();
    });
  });

  it('handles area checkbox changes', () => {
    renderJoin();

    const cruzBayCheckbox = screen.getByLabelText('Cruz Bay');
    fireEvent.click(cruzBayCheckbox);

    expect(cruzBayCheckbox).toBeChecked();
  });

  it('handles contact method changes and clears preferred when disabled', () => {
    renderJoin();

    // Enable WhatsApp and set as preferred
    const whatsappCheckbox = screen.getByLabelText('Enable WhatsApp button');
    fireEvent.click(whatsappCheckbox);
    
    const preferredSelect = screen.getByDisplayValue('None');
    fireEvent.change(preferredSelect, { target: { value: 'WHATSAPP' } });

    // Now disable WhatsApp
    fireEvent.click(whatsappCheckbox);

    // Preferred should be cleared
    expect(preferredSelect).toHaveValue('');
  });

  it('enables SMS contact method', () => {
    renderJoin();

    const smsCheckbox = screen.getByLabelText('Enable SMS button');
    expect(smsCheckbox).toBeChecked(); // Should be checked by default
    fireEvent.click(smsCheckbox);
    expect(smsCheckbox).not.toBeChecked();
  });

  it('shows alert on submission error', async () => {
    // Mock alert
    const alertMock = vi.fn();
    global.alert = alertMock;

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Cruz Bay', island: 'STJ' },
            { id: 2, name: 'Coral Bay', island: 'STJ' }
          ])
        });
      } else if (url.includes('/providers')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderJoin();

    // Fill required fields
    const nameLabel = screen.getByText('Name');
    const phoneLabel = screen.getByText('Phone');
    const nameInput = nameLabel.nextElementSibling as HTMLInputElement;
    const phoneInput = phoneLabel.nextElementSibling as HTMLInputElement;
    const islandSelect = screen.getByDisplayValue('Select Island');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });
    fireEvent.change(islandSelect, { target: { value: 'STJ' } });

    // Select categories and areas
    const electricianCheckbox = screen.getByLabelText('Electrician');
    fireEvent.click(electricianCheckbox);
    const cruzBayCheckbox = screen.getByLabelText('Cruz Bay');
    fireEvent.click(cruzBayCheckbox);

    // Enable a contact method to pass validation
    const callCheckbox = screen.getByLabelText('Enable Call button');
    fireEvent.click(callCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Error creating provider');
    });

    // Restore original alert
    global.alert = window.alert;
  });

  it('shows client-side validation errors for required fields', async () => {
    renderJoin();

    // Uncheck all contact method checkboxes to trigger validation error
    const callCheckbox = screen.getByLabelText('Enable Call button');
    const whatsappCheckbox = screen.getByLabelText('Enable WhatsApp button');
    const smsCheckbox = screen.getByLabelText('Enable SMS button');
    
    fireEvent.click(callCheckbox);
    fireEvent.click(whatsappCheckbox);
    fireEvent.click(smsCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
      expect(screen.getByText('Island is required')).toBeInTheDocument();
      expect(screen.getByText('At least one category required')).toBeInTheDocument();
      expect(screen.getByText('At least one area required')).toBeInTheDocument();
      expect(screen.getByText('At least one contact method must be enabled')).toBeInTheDocument();
    });
  });
});
