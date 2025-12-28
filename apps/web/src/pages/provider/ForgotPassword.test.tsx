import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
  };

  it('renders the forgot password form', () => {
    renderComponent();
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByText('Send reset link')).toBeInTheDocument();
  });

  it('renders header with HelpingHand branding', () => {
    renderComponent();
    expect(screen.getByText('HelpingHandVI')).toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('Email address');
    const submitButton = screen.getByText('Send reset link');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
    });
  });

  it('shows error message on failed submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'User not found' }),
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('Email address');
    const submitButton = screen.getByText('Send reset link');

    fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });
});
