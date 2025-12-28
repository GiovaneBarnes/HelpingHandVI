import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Join } from './Join';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
    localStorageMock.setItem.mockClear();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Electrician' },
            { id: 2, name: 'Plumber' },
            { id: 3, name: 'AC Technician' }
          ])
        });
      }
      if (url.includes('/providers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            id: 123, 
            name: 'John Doe',
            token: 'provider_123_1234567890',
            plan: 'PREMIUM',
            plan_source: 'TRIAL',
            trial_end_at: '2025-01-28T00:00:00.000Z',
            trial_days_left: 30
          })
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

  it('renders the join form with island selection and advice', () => {
    renderJoin();

    expect(screen.getByText('Join as Provider')).toBeInTheDocument();
    expect(screen.getByText('Choose a professional name that customers will recognize and trust.')).toBeInTheDocument();
    expect(screen.getByText('Choose your island carefully - this determines which customers can find you.')).toBeInTheDocument();
    
    // Check that island select is present
    const islandSelect = screen.getByDisplayValue('Select your island');
    expect(islandSelect).toBeInTheDocument();
    
    // Check for form element by finding the submit button within it
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    renderJoin();

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Business Phone')).toBeInTheDocument();
  });

  it('updates form state when inputs change', () => {
    renderJoin();

    // Find inputs by their labels
    const nameLabel = screen.getByText('Name');
    const phoneLabel = screen.getByText('Business Phone');
    const nameInput = nameLabel.nextElementSibling as HTMLInputElement;
    const phoneInput = phoneLabel.nextElementSibling as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });

    expect(nameInput).toHaveValue('John Doe');
    expect(phoneInput).toHaveValue('123-456-7890');
  });

  it('shows validation errors for required fields', async () => {
    renderJoin();

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
      expect(screen.getByText('Island is required')).toBeInTheDocument();
      expect(screen.getByText('At least one category required')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful submission', async () => {
    renderJoin();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electrician')).toBeInTheDocument();
    });

    // Fill required fields - find inputs by their labels
    const nameInput = screen.getByLabelText(/^Name/);
    const emailInput = screen.getByLabelText(/^Business Email/);
    const passwordInput = screen.getByLabelText(/^Password/);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
    const phoneInput = screen.getByLabelText(/^Business Phone/);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });

    // Select island
    const islandSelect = screen.getByDisplayValue('Select your island');
    fireEvent.change(islandSelect, { target: { value: 'STT' } });
    
    // Select a category checkbox
    const electricianCheckbox = screen.getByLabelText('Electrician');
    fireEvent.click(electricianCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('provider_token', 'provider_123_1234567890');
      expect(mockNavigate).toHaveBeenCalledWith('/provider/dashboard');
    });
  });

  it('renders the join form with island selection and advice', () => {
    renderJoin();

    expect(screen.getByText('Join as Provider')).toBeInTheDocument();
    expect(screen.getByText('Choose a professional name that customers will recognize and trust.')).toBeInTheDocument();
    expect(screen.getByText('Choose your island carefully - this determines which customers can find you.')).toBeInTheDocument();
    
    // Check that island select is present
    const islandSelect = screen.getByDisplayValue('Select your island');
    expect(islandSelect).toBeInTheDocument();
    
    // Check for form element by finding the submit button within it
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('allows selecting island and submits form', async () => {
    renderJoin();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electrician')).toBeInTheDocument();
    });

    // Fill required fields
    const nameInput = screen.getByLabelText(/^Name/);
    const emailInput = screen.getByLabelText(/^Business Email/);
    const passwordInput = screen.getByLabelText(/^Password/);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
    const phoneInput = screen.getByLabelText(/^Business Phone/);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });

    // Select island
    const islandSelect = screen.getByDisplayValue('Select your island');
    fireEvent.change(islandSelect, { target: { value: 'STT' } });

    // Select categories
    const electricianCheckbox = screen.getByLabelText('Electrician');
    fireEvent.click(electricianCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/providers',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"island":"STT"')
        })
      );
    });
  });

  it('shows alert on submission error', async () => {
    // Mock alert
    const alertMock = vi.fn();
    global.alert = alertMock;

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/providers')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    renderJoin();

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electrician')).toBeInTheDocument();
    });

    // Fill required fields
    const nameLabel = screen.getByText('Name');
    const phoneLabel = screen.getByText('Business Phone');
    const emailLabel = screen.getByText('Business Email');
    const passwordLabel = screen.getByText('Password');
    const confirmPasswordLabel = screen.getByText('Confirm Password');
    const nameInput = nameLabel.nextElementSibling as HTMLInputElement;
    const phoneInput = phoneLabel.nextElementSibling as HTMLInputElement;
    const emailInput = emailLabel.nextElementSibling as HTMLInputElement;
    const passwordInput = passwordLabel.nextElementSibling as HTMLInputElement;
    const confirmPasswordInput = confirmPasswordLabel.nextElementSibling as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Select island
    const islandSelect = screen.getByDisplayValue('Select your island');
    fireEvent.change(islandSelect, { target: { value: 'STT' } });

    // Select categories
    const electricianCheckbox = screen.getByLabelText('Electrician');
    fireEvent.click(electricianCheckbox);

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

    const submitButton = screen.getByRole('button', { name: 'Join' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
      expect(screen.getByText('Island is required')).toBeInTheDocument();
      expect(screen.getByText('At least one category required')).toBeInTheDocument();
    });
  });
});
