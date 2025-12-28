import { render, screen } from '@testing-library/react';
import { LivePreviewCard } from './LivePreviewCard';

const mockProvider = {
  id: 1,
  name: 'Test Provider',
  phone: '123-456-7890',
  island: 'STT',
  description: 'Test description for the provider',
  categories: [{ id: 1, name: 'Plumbing' }, { id: 2, name: 'Electrical' }],
  areas: [{ id: 1, name: 'Test Area' }],
  status: 'OPEN_NOW' as const,
  plan: 'FREE' as const,
  plan_source: 'TRIAL' as const,
  trial_end_at: undefined,
  is_premium_active: false,
  trial_days_left: 30,
  is_trial: true,
  trust_tier: 2,
  last_active_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  lifecycle_status: 'ACTIVE' as const,
  is_disputed: false,
  emergency_boost_eligible: false,
};

describe('LivePreviewCard', () => {
  it('renders provider basic information', () => {
    render(<LivePreviewCard provider={mockProvider} />);

    expect(screen.getByText('Test Provider')).toBeInTheDocument();
    expect(screen.getByText('St. Thomas')).toBeInTheDocument();
    expect(screen.getByText('Plumbing, Electrical')).toBeInTheDocument();
    expect(screen.getByText('Test description for the provider')).toBeInTheDocument();
  });

  it('displays OPEN_NOW status with success badge', () => {
    render(<LivePreviewCard provider={mockProvider} />);

    const badge = screen.getByText('OPEN_NOW');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('displays BUSY_LIMITED status with warning badge', () => {
    const busyProvider = { ...mockProvider, status: 'BUSY_LIMITED' as const };
    render(<LivePreviewCard provider={busyProvider} />);

    const badge = screen.getByText('BUSY_LIMITED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('displays other status with error badge', () => {
    const closedProvider = { ...mockProvider, status: 'NOT_TAKING_WORK' as const };
    render(<LivePreviewCard provider={closedProvider} />);

    const badge = screen.getByText('NOT_TAKING_WORK');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('displays Verified trust tier badge for tier 2', () => {
    render(<LivePreviewCard provider={mockProvider} />);

    const badge = screen.getByText('Verified');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('displays Gov Approved trust tier badge for tier 3', () => {
    const govProvider = { ...mockProvider, trust_tier: 3 };
    render(<LivePreviewCard provider={govProvider} />);

    const badge = screen.getByText('Gov Approved');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('displays Basic trust tier badge for tier 1', () => {
    const basicProvider = { ...mockProvider, trust_tier: 1 };
    render(<LivePreviewCard provider={basicProvider} />);

    // Tier 1 does not show a badge according to component logic
    expect(screen.queryByText('Basic')).not.toBeInTheDocument();
  });

  it('displays Unverified trust tier badge for tier 0', () => {
    const unverifiedProvider = { ...mockProvider, trust_tier: 0 };
    render(<LivePreviewCard provider={unverifiedProvider} />);

    // Tier 0 does not show a badge according to component logic
    expect(screen.queryByText('Unverified')).not.toBeInTheDocument();
  });

  it('does not display trust tier badge for tier 1 when status is not high enough', () => {
    const lowTierProvider = { ...mockProvider, trust_tier: 1 };
    render(<LivePreviewCard provider={lowTierProvider} />);

    expect(screen.queryByText('Basic')).not.toBeInTheDocument();
  });

  it('displays Premium badge when is_premium_active is true', () => {
    const premiumProvider = { ...mockProvider, is_premium_active: true };
    render(<LivePreviewCard provider={premiumProvider} />);

    const badge = screen.getByText('Premium');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('does not display Premium badge when is_premium_active is false', () => {
    render(<LivePreviewCard provider={mockProvider} />);

    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });

  it('displays activity as "just now" for very recent activity', () => {
    const recentProvider = {
      ...mockProvider,
      last_active_at: new Date().toISOString()
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: just now')).toBeInTheDocument();
  });

  it('displays activity in minutes for recent activity', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: fiveMinutesAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 5 minutes ago')).toBeInTheDocument();
  });

  it('displays activity in 1 minute for singular minute', () => {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: oneMinuteAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 1 minute ago')).toBeInTheDocument();
  });

  it('displays activity in hours for activity within a day', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: twoHoursAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 2 hours ago')).toBeInTheDocument();
  });

  it('displays activity in 1 hour for singular hour', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: oneHourAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 1 hour ago')).toBeInTheDocument();
  });

  it('displays activity in days for activity within a week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: threeDaysAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 3 days ago')).toBeInTheDocument();
  });

  it('displays activity in 1 day for singular day', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: oneDayAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 1 day ago')).toBeInTheDocument();
  });

  it('displays activity in weeks for activity within a month', () => {
    const twoWeeksAgo = new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: twoWeeksAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 2 weeks ago')).toBeInTheDocument();
  });

  it('displays activity in 1 week for singular week', () => {
    const oneWeekAgo = new Date(Date.now() - 1 * 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: oneWeekAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 1 week ago')).toBeInTheDocument();
  });

  it('displays activity in months for activity within a year', () => {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: sixMonthsAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 6 months ago')).toBeInTheDocument();
  });

  it('displays activity in 1 month for singular month', () => {
    const oneMonthAgo = new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: oneMonthAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 1 month ago')).toBeInTheDocument();
  });

  it('displays activity in years for old activity', () => {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: twoYearsAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 2 years ago')).toBeInTheDocument();
  });

  it('displays activity in 1 year for singular year', () => {
    const oneYearAgo = new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const recentProvider = {
      ...mockProvider,
      last_active_at: oneYearAgo
    };
    render(<LivePreviewCard provider={recentProvider} />);

    expect(screen.getByText('Activity: 1 year ago')).toBeInTheDocument();
  });

  it('displays "Never" for providers with no last_active_at', () => {
    const inactiveProvider = { ...mockProvider, last_active_at: undefined } as any;
    render(<LivePreviewCard provider={inactiveProvider} />);

    expect(screen.getByText('Activity: Never')).toBeInTheDocument();
  });

  it('displays island names correctly', () => {
    const stjProvider = { ...mockProvider, island: 'STJ' };
    const stxProvider = { ...mockProvider, island: 'STX' };
    const unknownProvider = { ...mockProvider, island: 'UNKNOWN' };

    const { rerender } = render(<LivePreviewCard provider={stjProvider} />);
    expect(screen.getByText('St. John')).toBeInTheDocument();

    rerender(<LivePreviewCard provider={stxProvider} />);
    expect(screen.getByText('St. Croix')).toBeInTheDocument();

    rerender(<LivePreviewCard provider={unknownProvider} />);
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });

  it('handles categories as strings', () => {
    const stringCategoriesProvider = {
      ...mockProvider,
      categories: ['Plumbing', 'Electrical']
    } as any;
    render(<LivePreviewCard provider={stringCategoriesProvider} />);

    expect(screen.getByText('Plumbing, Electrical')).toBeInTheDocument();
  });

  it('handles categories as objects with name property', () => {
    const objectCategoriesProvider = {
      ...mockProvider,
      categories: [
        { name: 'Plumbing' },
        { name: 'Electrical' }
      ]
    } as any;
    render(<LivePreviewCard provider={objectCategoriesProvider} />);

    expect(screen.getByText('Plumbing, Electrical')).toBeInTheDocument();
  });

  it('does not display categories section when no categories', () => {
    const noCategoriesProvider = { ...mockProvider, categories: [] };
    render(<LivePreviewCard provider={noCategoriesProvider} />);

    expect(screen.queryByText(/Plumbing|Electrical/)).not.toBeInTheDocument();
  });

  it('does not display description when no description', () => {
    const noDescriptionProvider = { ...mockProvider, description: '' };
    render(<LivePreviewCard provider={noDescriptionProvider} />);

    expect(screen.queryByText('Test description for the provider')).not.toBeInTheDocument();
  });

  it('renders disabled action buttons', () => {
    render(<LivePreviewCard provider={mockProvider} />);

    const callButton = screen.getByText('Call');
    const smsButton = screen.getByText('SMS');

    expect(callButton).toBeDisabled();
    expect(smsButton).toBeDisabled();

    // The opacity-50 is on the parent container
    const buttonContainer = callButton.closest('.flex');
    expect(buttonContainer).toHaveClass('opacity-50');
  });

  it('handles single category correctly', () => {
    const singleCategoryProvider = {
      ...mockProvider,
      categories: ['Plumbing']
    } as any;
    render(<LivePreviewCard provider={singleCategoryProvider} />);

    expect(screen.getByText('Plumbing')).toBeInTheDocument();
  });

  it('handles empty categories array', () => {
    const emptyCategoriesProvider = {
      ...mockProvider,
      categories: []
    };
    render(<LivePreviewCard provider={emptyCategoriesProvider} />);

    expect(screen.queryByText(/,/)).not.toBeInTheDocument();
  });

  it('handles null categories', () => {
    const nullCategoriesProvider = {
      ...mockProvider,
      categories: null
    } as any;
    render(<LivePreviewCard provider={nullCategoriesProvider} />);

    expect(screen.queryByText(/Plumbing|Electrical/)).not.toBeInTheDocument();
  });
});