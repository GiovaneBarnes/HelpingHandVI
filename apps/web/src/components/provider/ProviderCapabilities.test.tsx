import { render, screen } from '@testing-library/react';
import { ProviderCapabilities } from './ProviderCapabilities';

const mockProvider = {
  id: 1,
  name: 'Test Provider',
  phone: '123-456-7890',
  island: 'STT',
  description: 'Test description',
  categories: [{ id: 1, name: 'Plumbing' }],
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
  emergency_boost_eligible: true,
  badges: [
    { type: 'GOV_APPROVED' as const },
    { type: 'VERIFIED' as const },
    { type: 'EMERGENCY_READY' as const }
  ],
};

describe('ProviderCapabilities', () => {
  it('renders the main sections', () => {
    render(<ProviderCapabilities provider={mockProvider} />);

    expect(screen.getByText('Trust & Verification')).toBeInTheDocument();
    expect(screen.getByText('Premium Features')).toBeInTheDocument();
    expect(screen.getByText('Special Certifications')).toBeInTheDocument();
    expect(screen.getByText('Identity Protection')).toBeInTheDocument();
  });

  describe('Trust & Verification section', () => {
    it('displays trust tier for level 2 (Verified Provider)', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.getByText('Trust Level:')).toBeInTheDocument();
      expect(screen.getByText('Verified Provider')).toBeInTheDocument();
    });

    it('displays trust tier for level 3 (Government Approved)', () => {
      const govProvider = { ...mockProvider, trust_tier: 3 };
      render(<ProviderCapabilities provider={govProvider} />);

      // Look for the badge specifically in the trust level section
      const trustLevelSection = screen.getByText('Trust Level:').closest('div');
      const govBadge = trustLevelSection?.querySelector('[class*="bg-green-100"]');
      expect(govBadge).toHaveTextContent('Government Approved');
    });

    it('displays trust tier for level 1 (Basic Provider)', () => {
      const basicProvider = { ...mockProvider, trust_tier: 1 };
      render(<ProviderCapabilities provider={basicProvider} />);

      expect(screen.getByText('Basic Provider')).toBeInTheDocument();
    });

    it('displays trust tier for level 0 (Unverified)', () => {
      const unverifiedProvider = { ...mockProvider, trust_tier: 0 };
      render(<ProviderCapabilities provider={unverifiedProvider} />);

      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });

    it('displays account status', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.getByText('Account Status:')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('displays different lifecycle statuses with correct colors', () => {
      const { rerender } = render(<ProviderCapabilities provider={mockProvider} />);

      // ACTIVE status
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();

      // PENDING status
      const pendingProvider = { ...mockProvider, lifecycle_status: 'PENDING' as const };
      rerender(<ProviderCapabilities provider={pendingProvider} />);
      expect(screen.getByText('PENDING')).toBeInTheDocument();

      // SUSPENDED status
      const suspendedProvider = { ...mockProvider, lifecycle_status: 'SUSPENDED' as const };
      rerender(<ProviderCapabilities provider={suspendedProvider} />);
      expect(screen.getByText('SUSPENDED')).toBeInTheDocument();
    });

    it('displays dispute status when provider is disputed', () => {
      const disputedProvider = { ...mockProvider, is_disputed: true };
      render(<ProviderCapabilities provider={disputedProvider} />);

      expect(screen.getByText('Dispute Status:')).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
    });

    it('does not display dispute status when provider is not disputed', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.queryByText('Dispute Status:')).not.toBeInTheDocument();
      expect(screen.queryByText('Under Review')).not.toBeInTheDocument();
    });
  });

  describe('Premium Features section', () => {
    it('displays free plan for non-premium users', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.getByText('Plan:')).toBeInTheDocument();
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });

    it('displays premium plan for premium users', () => {
      const premiumProvider = { ...mockProvider, is_premium_active: true };
      render(<ProviderCapabilities provider={premiumProvider} />);

      expect(screen.getByText('Premium Active')).toBeInTheDocument();
    });

    it('displays trial information when user is on trial', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.getByText('Trial Remaining:')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
    });

    it('does not display trial information when user is not on trial', () => {
      const nonTrialProvider = { ...mockProvider, is_trial: false };
      render(<ProviderCapabilities provider={nonTrialProvider} />);

      expect(screen.queryByText('Trial Remaining:')).not.toBeInTheDocument();
      expect(screen.queryByText('30 days')).not.toBeInTheDocument();
    });

    it('displays emergency readiness as Yes when eligible', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.getByText('Emergency Ready:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('displays emergency readiness as No when not eligible', () => {
      const notEligibleProvider = { ...mockProvider, emergency_boost_eligible: false };
      render(<ProviderCapabilities provider={notEligibleProvider} />);

      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('Special Certifications section', () => {
    it('displays special certifications when badges exist', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.getByText('Government Approved')).toBeInTheDocument();
      expect(screen.getByText('Identity Verified')).toBeInTheDocument();
      expect(screen.getByText('Emergency Services')).toBeInTheDocument();
    });

    it('filters out PREMIUM and TRIAL badges', () => {
      const providerWithFilteredBadges = {
        ...mockProvider,
        badges: [
          { type: 'GOV_APPROVED' },
          { type: 'PREMIUM' },
          { type: 'TRIAL' },
          { type: 'VERIFIED' }
        ]
      } as any;
      render(<ProviderCapabilities provider={providerWithFilteredBadges} />);

      expect(screen.getByText('Government Approved')).toBeInTheDocument();
      expect(screen.getByText('Identity Verified')).toBeInTheDocument();
      expect(screen.queryByText('PREMIUM')).not.toBeInTheDocument();
      expect(screen.queryByText('TRIAL')).not.toBeInTheDocument();
    });

    it('displays no certifications message when no badges exist', () => {
      const noBadgesProvider = { ...mockProvider, badges: [] };
      render(<ProviderCapabilities provider={noBadgesProvider} />);

      expect(screen.getByText('No special certifications')).toBeInTheDocument();
    });

    it('displays no certifications message when badges is undefined', () => {
      const undefinedBadgesProvider = { ...mockProvider, badges: undefined };
      render(<ProviderCapabilities provider={undefinedBadgesProvider} />);

      expect(screen.getByText('No special certifications')).toBeInTheDocument();
    });
  });

  describe('Identity Protection section', () => {
    it('displays identity protection notice', () => {
      render(<ProviderCapabilities provider={mockProvider} />);

      expect(screen.getByText('Identity Protection')).toBeInTheDocument();
      expect(screen.getByText(/Your business name, location, and core identity information require admin approval/)).toBeInTheDocument();
      expect(screen.getByText(/Contact support if you need to update these details/)).toBeInTheDocument();
    });
  });

  describe('Badge styling', () => {
    it('applies correct colors for trust tiers', () => {
      // Test tier 2 (warning)
      const { rerender } = render(<ProviderCapabilities provider={mockProvider} />);
      const trustLevelSections = screen.getAllByText('Trust Level:');
      const firstTrustSection = trustLevelSections[0].closest('div');
      const verifiedBadge = firstTrustSection?.querySelector('[class*="bg-yellow-100"]');
      expect(verifiedBadge).toHaveTextContent('Verified Provider');

      // Test tier 3 (success) - render fresh component
      const govProvider = { ...mockProvider, trust_tier: 3 };
      rerender(<ProviderCapabilities provider={govProvider} />);
      const govTrustLevelSections = screen.getAllByText('Trust Level:');
      const govTrustSection = govTrustLevelSections[govTrustLevelSections.length - 1].closest('div');
      const govBadge = govTrustSection?.querySelector('[class*="bg-green-100"]');
      expect(govBadge).toHaveTextContent('Government Approved');
    });

    it('applies correct colors for lifecycle status', () => {
      // ACTIVE (success)
      render(<ProviderCapabilities provider={mockProvider} />);
      const activeBadge = screen.getByText('ACTIVE');
      expect(activeBadge).toHaveClass('bg-green-100', 'text-green-800');

      // PENDING (warning)
      const { rerender } = render(<ProviderCapabilities provider={mockProvider} />);
      const pendingProvider = { ...mockProvider, lifecycle_status: 'PENDING' as const };
      rerender(<ProviderCapabilities provider={pendingProvider} />);
      const pendingBadge = screen.getByText('PENDING');
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });
});