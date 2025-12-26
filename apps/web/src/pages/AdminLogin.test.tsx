import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminLogin } from './AdminLogin';

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLogin', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  const renderAdminLogin = () => {
    return render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
  };

  it('renders login form with title', () => {
    renderAdminLogin();

    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('updates password state when input changes', () => {
    renderAdminLogin();

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    expect(passwordInput).toHaveValue('testpassword');
  });

  it('submits form with correct password', async () => {
    renderAdminLogin();

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin_logged_in', 'true');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/providers');
    });
  });

  it('navigates to admin providers on successful login', async () => {
    renderAdminLogin();

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin_logged_in', 'true');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/providers');
    });
  });

  it('shows error message on invalid password', async () => {
    renderAdminLogin();

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
  });

  it('has correct input attributes', () => {
    renderAdminLogin();

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveClass('w-full', 'border', 'rounded', 'px-3', 'py-2');
  });
});