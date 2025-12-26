import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock all the page components to avoid complex dependencies
vi.mock('./pages/Home', () => ({
  Home: () => <div>Home Page</div>,
}));

vi.mock('./pages/ProviderDetail', () => ({
  ProviderDetail: () => <div>Provider Detail Page</div>,
}));

vi.mock('./pages/Join', () => ({
  Join: () => <div>Join Page</div>,
}));

vi.mock('./pages/Dashboard', () => ({
  Dashboard: () => <div>Dashboard Page</div>,
}));

vi.mock('./pages/AdminLogin', () => ({
  AdminLogin: () => <div>Admin Login Page</div>,
}));

vi.mock('./pages/AdminProviders', () => ({
  AdminProviders: () => <div>Admin Providers Page</div>,
}));

vi.mock('./pages/AdminReports', () => ({
  AdminReports: () => <div>Admin Reports Page</div>,
}));

vi.mock('./pages/AdminSettings', () => ({
  AdminSettings: () => <div>Admin Settings Page</div>,
}));

describe('App', () => {
  it('renders the home page by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders provider detail page', () => {
    render(
      <MemoryRouter initialEntries={['/provider/123']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Provider Detail Page')).toBeInTheDocument();
  });

  it('renders join page', () => {
    render(
      <MemoryRouter initialEntries={['/join']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Join Page')).toBeInTheDocument();
  });

  it('renders dashboard page', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/123']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders admin login page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Login Page')).toBeInTheDocument();
  });

  it('renders admin providers page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/providers']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Providers Page')).toBeInTheDocument();
  });

  it('renders admin reports page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/reports']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Reports Page')).toBeInTheDocument();
  });

  it('redirects /admin to /admin/login', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Login Page')).toBeInTheDocument();
  });

  it('renders admin settings page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Settings Page')).toBeInTheDocument();
  });
});