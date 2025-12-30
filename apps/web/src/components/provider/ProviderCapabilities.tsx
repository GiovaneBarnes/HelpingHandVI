import React, { useState, useEffect } from 'react';
import { Provider } from '../../services/providerApi';
import { Badge } from '../Badge';
import { Card } from '../Card';

interface ProviderCapabilitiesProps {
  provider: Provider;
}

const getTrustTierLabel = (tier: number) => {
  switch (tier) {
    case 3: return 'Government Approved';
    case 2: return 'Verified Provider';
    case 1: return 'Basic Provider';
    default: return 'Unverified';
  }
};

const getTrustTierColor = (tier: number) => {
  switch (tier) {
    case 3: return 'success';
    case 2: return 'warning';
    case 1: return 'secondary';
    default: return 'error';
  }
};

const getLifecycleStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'PENDING': return 'warning';
    case 'SUSPENDED': return 'error';
    default: return 'secondary';
  }
};

const PremiumCountdown: React.FC<{ provider: Provider; isPremium: boolean; isTrial: boolean }> = ({ provider, isPremium, isTrial }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      let endDate: Date | null = null;
      
      if (provider.trial_end_at) {
        endDate = new Date(provider.trial_end_at);
      } else if (provider.is_trial && provider.trial_days_left > 0) {
        // Estimate end date from trial_days_left
        endDate = new Date(Date.now() + provider.trial_days_left * 24 * 60 * 60 * 1000);
      }
      
      if (!endDate) return;
      
      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) {
        setTimeLeft(`${diffDays}d ${diffHours}h`);
      } else if (diffHours > 0) {
        setTimeLeft(`${diffHours}h ${diffMinutes}m`);
      } else {
        setTimeLeft(`${diffMinutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [provider.trial_end_at, provider.trial_days_left, isTrial]);

  if (!isPremium) {
    return null;
  }

  // For trial users, show countdown
  if (isTrial) {
    const isExpiringSoon = provider.trial_days_left <= 7;
    const isExpired = timeLeft === 'Expired';

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Trial Expires:</span>
        <Badge
          label={timeLeft || `${provider.trial_days_left} days`}
          variant={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'secondary'}
        />
      </div>
    );
  }

  // For paid/admin users, show status if they have expiration
  if (provider.trial_end_at) {
    const isExpiringSoon = provider.trial_days_left <= 7;
    const isExpired = timeLeft === 'Expired';

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Premium Expires:</span>
        <Badge
          label={timeLeft}
          variant={isExpired ? 'error' : isExpiringSoon ? 'warning' : 'secondary'}
        />
      </div>
    );
  }

  // For permanent premium access
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">Access Status:</span>
      <Badge label="Permanent" variant="success" />
    </div>
  );
};

export const ProviderCapabilities: React.FC<ProviderCapabilitiesProps> = ({ provider }) => {
  // Compute plan-related values
  const plan = provider.plan?.toUpperCase();
  const planSource = provider.plan_source?.toUpperCase();

  const isPremium =
    (provider as any).is_premium_active ?? (plan === "PREMIUM");

  const isTrial =
    (provider as any).is_trial ?? (planSource === "TRIAL");

  return (
    <Card className="space-y-6">
      {/* Trust & Verification Status */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Trust & Verification</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Trust Level:</span>
            <Badge label={getTrustTierLabel(provider.trust_tier)} variant={getTrustTierColor(provider.trust_tier)} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Account Status:</span>
            <Badge
              label={provider.lifecycle_status}
              variant={getLifecycleStatusColor(provider.lifecycle_status)}
            />
          </div>

          {provider.is_disputed && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dispute Status:</span>
              <Badge label="Under Review" variant="error" />
            </div>
          )}
        </div>
      </div>

      {/* Premium Status */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Premium Features</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plan:</span>
            <Badge
              label={isPremium ? 'Premium Active' : 'Free Plan'}
              variant={isPremium ? 'success' : 'secondary'}
            />
          </div>

          {isPremium && (
            <PremiumCountdown provider={provider} isPremium={isPremium} isTrial={isTrial} />
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Emergency Ready:</span>
            <Badge
              label={provider.emergency_boost_eligible ? 'Yes' : 'No'}
              variant={provider.emergency_boost_eligible ? 'success' : 'secondary'}
            />
          </div>
        </div>
      </div>

      {/* Special Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Special Certifications</h3>
        <div className="space-y-2">
          {provider.badges && provider.badges.length > 0 ? (
            provider.badges
              .filter(badge => !['PREMIUM', 'TRIAL'].includes(badge.type))
              .map((badge, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {badge.type === 'GOV_APPROVED' && 'Government Approved'}
                    {badge.type === 'VERIFIED' && 'Identity Verified'}
                    {badge.type === 'EMERGENCY_READY' && 'Emergency Services'}
                  </span>
                  <Badge label="✓" variant="success" />
                </div>
              ))
          ) : (
            <p className="text-sm text-gray-500">No special certifications</p>
          )}
        </div>
      </div>

      {/* Identity Protection Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Identity Protection</h4>
        <p className="text-xs text-blue-700">
          Your business name, location, and core identity information require admin approval to change.
          This protects both you and your customers. Contact support if you need to update these details.
        </p>
      </div>
    </Card>
  );
};