import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (token = 'valid-token') => {
    return render(
      <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
        <ResetPassword />
      </MemoryRouter>
    );
  };

  it('renders the reset password form with valid token', () => {
    renderComponent();
    expect(screen.getByText('Set new password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
    expect(screen.getByText('Reset password')).toBeInTheDocument();
  });

  it('shows invalid link message when no token provided', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );
    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderComponent();

    const passwordInput = screen.getByPlaceholderText('New password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    const submitButton = screen.getByText('Reset password');

    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/reset-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'valid-token', password: 'newpassword123' }),
        }
      );
    });
  });

  it('shows error when passwords do not match', async () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText('New password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    const submitButton = screen.getByText('Reset password');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });
});
