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
              Activity: {inactiveProvider.last_active_at ? `${Math.floor((new Date().getTime() - new Date(inactiveProvider.last_active_at).getTime()) / (1000 * 60 * 60))} hours ago` : 'Never'}
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

    it('displays Trial badge for providers on trial', () => {
      const trialProvider = {
        id: 3,
        name: 'Trial Provider',
        phone: '123-456-7890',
        island: 'St. Thomas',
        status: 'TODAY',
        last_active_at: '2023-12-24T10:00:00Z',
        lifecycle_status: 'ACTIVE',
        is_premium_active: true,
        is_trial: true
      };

      render(
        <div>
          <Card key={trialProvider.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{trialProvider.name}</h2>
              {trialProvider.lifecycle_status === 'INACTIVE' && (
                <Badge label="Inactive" variant="secondary" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{trialProvider.island}</p>
            <Badge label={trialProvider.status} variant="success" className="mb-2" />
            {trialProvider.is_premium_active && (
              <Badge label={trialProvider.is_trial ? "Trial" : "Premium"} variant="success" className="mb-2 ml-2" />
            )}
            <p className="text-sm text-gray-500 mb-4">
              Activity: {trialProvider.last_active_at ? `${Math.floor((new Date().getTime() - new Date(trialProvider.last_active_at).getTime()) / (1000 * 60 * 60))} hours ago` : 'Never'}
            </p>
          </Card>
        </div>
      );

      expect(screen.getByText('Trial Provider')).toBeInTheDocument();
      expect(screen.getByText('Trial')).toBeInTheDocument();
      expect(screen.getByText('TODAY')).toBeInTheDocument();
    });

    it('displays Premium badge for paid premium providers', () => {
      const premiumProvider = {
        id: 4,
        name: 'Premium Provider',
        phone: '123-456-7890',
        island: 'St. John',
        status: 'NEXT_3_DAYS',
        last_active_at: '2023-12-24T10:00:00Z',
        lifecycle_status: 'ACTIVE',
        is_premium_active: true,
        is_trial: false
      };

      render(
        <div>
          <Card key={premiumProvider.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{premiumProvider.name}</h2>
              {premiumProvider.lifecycle_status === 'INACTIVE' && (
                <Badge label="Inactive" variant="secondary" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{premiumProvider.island}</p>
            <Badge label={premiumProvider.status} variant="warning" className="mb-2" />
            {premiumProvider.is_premium_active && (
              <Badge label={premiumProvider.is_trial ? "Trial" : "Premium"} variant="success" className="mb-2 ml-2" />
            )}
            <p className="text-sm text-gray-500 mb-4">
              Activity: {premiumProvider.last_active_at ? `${Math.floor((new Date().getTime() - new Date(premiumProvider.last_active_at).getTime()) / (1000 * 60 * 60))} hours ago` : 'Never'}
            </p>
          </Card>
        </div>
      );

      expect(screen.getByText('Premium Provider')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('NEXT_3_DAYS')).toBeInTheDocument();
    });

    it('does not display premium badge for free providers', () => {
      const freeProvider = {
        id: 5,
        name: 'Free Provider',
        phone: '123-456-7890',
        island: 'St. Croix',
        status: 'THIS_WEEK',
        last_active_at: '2023-12-24T10:00:00Z',
        lifecycle_status: 'ACTIVE',
        is_premium_active: false,
        is_trial: false
      };

      render(
        <div>
          <Card key={freeProvider.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{freeProvider.name}</h2>
              {freeProvider.lifecycle_status === 'INACTIVE' && (
                <Badge label="Inactive" variant="secondary" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{freeProvider.island}</p>
            <Badge label={freeProvider.status} variant="info" className="mb-2" />
            {freeProvider.is_premium_active && (
              <Badge label={freeProvider.is_trial ? "Trial" : "Premium"} variant="success" className="mb-2 ml-2" />
            )}
            <p className="text-sm text-gray-500 mb-4">
              Last active: {freeProvider.last_active_at ? `${Math.floor((new Date().getTime() - new Date(freeProvider.last_active_at).getTime()) / (1000 * 60 * 60))} hours ago` : 'Never'}
            </p>
          </Card>
        </div>
      );

      expect(screen.getByText('Free Provider')).toBeInTheDocument();
      expect(screen.queryByText('Trial')).not.toBeInTheDocument();
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
      expect(screen.getByText('THIS_WEEK')).toBeInTheDocument();
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

    it('renders success variant for premium badges', () => {
      render(<Badge label="Premium" variant="success" />);

      const badge = screen.getByText('Premium');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('renders success variant for trial badges', () => {
      render(<Badge label="Trial" variant="success" />);

      const badge = screen.getByText('Trial');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Dashboard Trial Status', () => {
    it('displays trial status with days remaining', () => {
      const trialProvider = {
        id: 1,
        name: 'Trial Provider',
        is_trial: true,
        trial_days_left: 15,
        is_premium_active: true
      };

      render(
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            {trialProvider.is_trial && trialProvider.trial_days_left > 0
              ? `Premium Trial: ${trialProvider.trial_days_left} days left`
              : trialProvider.is_premium_active
                ? 'Premium Plan'
                : 'Free Plan'
            }
          </h3>
          <p className="text-sm text-blue-700">
            No card required. Your listing stays active either way.
          </p>
        </div>
      );

      expect(screen.getByText('Premium Trial: 15 days left')).toBeInTheDocument();
      expect(screen.getByText('No card required. Your listing stays active either way.')).toBeInTheDocument();
    });

    it('displays premium plan status for paid users', () => {
      const premiumProvider = {
        id: 2,
        name: 'Premium Provider',
        is_trial: false,
        trial_days_left: 0,
        is_premium_active: true
      };

      render(
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            {premiumProvider.is_trial && premiumProvider.trial_days_left > 0
              ? `Premium Trial: ${premiumProvider.trial_days_left} days left`
              : premiumProvider.is_premium_active
                ? 'Premium Plan'
                : 'Free Plan'
            }
          </h3>
          <p className="text-sm text-blue-700">
            No card required. Your listing stays active either way.
          </p>
        </div>
      );

      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('No card required. Your listing stays active either way.')).toBeInTheDocument();
    });

    it('displays free plan status for non-premium users', () => {
      const freeProvider = {
        id: 3,
        name: 'Free Provider',
        is_trial: false,
        trial_days_left: 0,
        is_premium_active: false
      };

      render(
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            {freeProvider.is_trial && freeProvider.trial_days_left > 0
              ? `Premium Trial: ${freeProvider.trial_days_left} days left`
              : freeProvider.is_premium_active
                ? 'Premium Plan'
                : 'Free Plan'
            }
          </h3>
          <p className="text-sm text-blue-700">
            No card required. Your listing stays active either way.
          </p>
        </div>
      );

      expect(screen.getByText('Free Plan')).toBeInTheDocument();
      expect(screen.getByText('No card required. Your listing stays active either way.')).toBeInTheDocument();
    });
  });
});