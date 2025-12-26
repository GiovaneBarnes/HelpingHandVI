import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

// Mock the API_BASE
vi.mock('../pages/Home', () => ({
  API_BASE: 'http://localhost:3000'
}));

describe('Frontend Trust System Features', () => {
  describe('Provider Cards', () => {
    it('displays inactive badge for INACTIVE providers', () => {
      const inactiveProvider = {
        id: 1,
        name: 'Inactive Provider',
        phone: '123-456-7890',
        island: 'St. Thomas',
        status: 'TODAY',
        last_active_at: '2023-12-20T10:00:00Z',
        lifecycle_status: 'INACTIVE'
      };

      render(
        <div>
          <Card key={inactiveProvider.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{inactiveProvider.name}</h2>
              {inactiveProvider.lifecycle_status === 'INACTIVE' && (
                <Badge label="Inactive" variant="secondary" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{inactiveProvider.island}</p>
            <Badge label={inactiveProvider.status} variant="success" className="mb-2" />
            <p className="text-sm text-gray-500 mb-4">
              Last active: {inactiveProvider.last_active_at ? `${Math.floor((new Date().getTime() - new Date(inactiveProvider.last_active_at).getTime()) / (1000 * 60 * 60))} hours ago` : 'Never'}
            </p>
          </Card>
        </div>
      );

      expect(screen.getByText('Inactive Provider')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('St. Thomas')).toBeInTheDocument();
      expect(screen.getByText('TODAY')).toBeInTheDocument();
    });

    it('does not display inactive badge for ACTIVE providers', () => {
      const activeProvider = {
        id: 2,
        name: 'Active Provider',
        phone: '123-456-7890',
        island: 'St. John',
        status: 'NEXT_3_DAYS',
        last_active_at: '2023-12-24T10:00:00Z',
        lifecycle_status: 'ACTIVE'
      };

      render(
        <div>
          <Card key={activeProvider.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{activeProvider.name}</h2>
              {activeProvider.lifecycle_status === 'INACTIVE' && (
                <Badge label="Inactive" variant="secondary" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{activeProvider.island}</p>
            <Badge label={activeProvider.status} variant="warning" className="mb-2" />
            <p className="text-sm text-gray-500 mb-4">
              Last active: {activeProvider.last_active_at ? `${Math.floor((new Date().getTime() - new Date(activeProvider.last_active_at).getTime()) / (1000 * 60 * 60))} hours ago` : 'Never'}
            </p>
          </Card>
        </div>
      );

      expect(screen.getByText('Active Provider')).toBeInTheDocument();
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
      expect(screen.getByText('St. John')).toBeInTheDocument();
      expect(screen.getByText('NEXT_3_DAYS')).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('renders secondary variant for inactive status', () => {
      render(<Badge label="Inactive" variant="secondary" />);

      const badge = screen.getByText('Inactive');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('renders success variant for availability status', () => {
      render(<Badge label="TODAY" variant="success" />);

      const badge = screen.getByText('TODAY');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });
});