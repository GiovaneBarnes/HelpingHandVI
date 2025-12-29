import React from 'react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Provider } from '../../services/providerApi';

interface LivePreviewCardProps {
  provider: Provider;
}

const getAvailabilityColor = (status: string) => {
  switch (status) {
    case 'OPEN_NOW': return 'success';
    case 'BUSY_LIMITED': return 'warning';
    default: return 'error';
  }
};

const getTrustTierBadge = (tier: number) => {
  switch (tier) {
    case 3: return { label: 'Gov Approved', variant: 'success' as const };
    case 2: return { label: 'Verified', variant: 'warning' as const };
    case 1: return { label: 'Basic', variant: 'secondary' as const };
    default: return { label: 'Unverified', variant: 'error' as const };
  }
};

const getIslandDisplayName = (islandCode: string) => {
  switch (islandCode) {
    case 'STT': return 'St. Thomas';
    case 'STJ': return 'St. John';
    case 'STX': return 'St. Croix';
    default: return islandCode;
  }
};

const getHoursAgo = (lastActiveAt: string) => {
  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }
};

export const LivePreviewCard: React.FC<LivePreviewCardProps> = ({ provider }) => {
  return (
    <Card className="max-w-md">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-semibold">{provider.name}</h2>
      </div>
      <p className="text-gray-600 mb-2">{getIslandDisplayName(provider.island)}</p>
      {provider.categories && provider.categories.length > 0 && (
        <p className="text-sm text-gray-500 mb-2">
          {provider.categories.map((c) => c.name).join(', ')}
        </p>
      )}
      <Badge label={provider.status} variant={getAvailabilityColor(provider.status)} className="mb-2" />
      {provider.trust_tier && provider.trust_tier > 1 && (
        <Badge
          label={getTrustTierBadge(provider.trust_tier).label}
          variant={getTrustTierBadge(provider.trust_tier).variant}
          className="mb-2 ml-2"
        />
      )}
      {provider.is_premium_active && (
        <Badge label="Premium" variant="success" className="mb-2 ml-2" />
      )}
      <p className="text-sm text-gray-500 mb-4">
        Activity: {provider.last_active_at ? getHoursAgo(provider.last_active_at) : 'Never'}
      </p>
      {provider.description && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{provider.description}</p>
      )}
      <div className="flex space-x-2 opacity-50">
        {(provider.contact_preference === 'PHONE' || provider.contact_preference === 'BOTH') && (
          <button 
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Call
          </button>
        )}
        {(provider.contact_preference === 'PHONE' || provider.contact_preference === 'BOTH') && (
          <button 
            className="px-4 py-2 rounded bg-gray-600 text-white"
          >
            SMS
          </button>
        )}
        {(provider.contact_preference === 'EMAIL' || provider.contact_preference === 'BOTH') && provider.email && (
          <button 
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Email
          </button>
        )}
      </div>
    </Card>
  );
};