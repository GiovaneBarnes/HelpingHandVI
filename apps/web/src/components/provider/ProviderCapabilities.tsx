import React from 'react';
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

export const ProviderCapabilities: React.FC<ProviderCapabilitiesProps> = ({ provider }) => {
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
              label={provider.is_premium_active ? 'Premium Active' : 'Free Plan'}
              variant={provider.is_premium_active ? 'success' : 'secondary'}
            />
          </div>

          {provider.is_trial && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Trial Remaining:</span>
              <Badge label={`${provider.trial_days_left} days`} variant="warning" />
            </div>
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