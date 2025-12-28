import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { DisclaimerNotice } from '../components/DisclaimerNotice';

interface Provider {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  island: string;
  profile: {
    description?: string;
  };
  status: string;
  last_active_at: string;
  lifecycle_status: string;
  is_premium_active: boolean;
  is_trial: boolean;
  categories: string[];
}

type Filters = {
  island: string;
  categoryId: string;
  status: string;
};

interface Suggestion {
  id: string;
  label: string;
  description?: string;
  patch: Partial<Record<keyof Filters, string | null>>;
}

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

const getAvailabilityColor = (status: string) => {
  switch (status) {
    case 'OPEN_NOW': return 'success';
    case 'BUSY_LIMITED': return 'warning';
    default: return 'error';
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

export const Home: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filters, setFilters] = useState<Filters>({
    island: '',
    categoryId: '',
    status: '',
  });
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [emergencyMode, setEmergencyMode] = useState({ enabled: false });

  useEffect(() => {
    fetchCategories();
    fetchEmergencyMode();
  }, []);

  const fetchEmergencyMode = async () => {
    try {
      const response = await fetch(`${API_BASE}/settings/emergency-mode`);
      if (response.ok) {
        const data = await response.json();
        setEmergencyMode(data.data || { enabled: false });
      } else {
        setEmergencyMode({ enabled: false });
      }
    } catch (err) {
      console.error('Failed to fetch emergency mode');
      setEmergencyMode({ enabled: false });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        const categories = await response.json();
        setAvailableCategories(categories);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProviders = useCallback(async (reset = false) => {
    console.log(`[DEBUG] fetchProviders called with reset=${reset}, current filters:`, filters);
    if (reset) {
      setLoading(true);
      setCursor(null);
      setHasMore(false);
      setSuggestions([]);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.island) params.append('island', filters.island);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.status) params.append('status', filters.status);
      if (!reset && cursor) params.append('cursor', cursor);

      const url = `${API_BASE}/providers?${params}`;
      console.log('[DEBUG] Fetching providers from URL:', url);

      const response = await fetch(url);
      console.log('[DEBUG] Response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      console.log('[DEBUG] Response data:', data);
      if (data.error) throw new Error(data.error);

      if (reset) {
        setProviders(data.data.providers);
        console.log('[DEBUG] Set providers (reset):', data.data.providers.length, 'providers');
      } else {
        setProviders(prev => {
          const newProviders = [...prev, ...data.data.providers];
          console.log('[DEBUG] Added providers (load more):', data.data.providers.length, 'new providers, total:', newProviders.length);
          return newProviders;
        });
      }
      setCursor(data.data.nextCursor);
      setHasMore(!!data.data.nextCursor);
      if (reset && data.data.providers.length === 0) {
        setSuggestions(data.data.suggestions || []);
        console.log('[DEBUG] No providers found, set suggestions:', data.data.suggestions);
      }
    } catch (err) {
      console.error('[DEBUG] Error fetching providers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      console.log('[DEBUG] fetchProviders completed');
    }
  }, [filters, cursor]);

  useEffect(() => {
    console.log('[DEBUG] Filters changed, fetching providers:', filters);
    fetchProviders(true);
    fetchEmergencyMode();
  }, [filters, fetchProviders]);

  const handleFilterChange = (key: string, value: string) => {
    console.log(`[DEBUG] Filter change: ${key} = "${value}"`);
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('[DEBUG] New filters state:', newFilters);
      return newFilters;
    });
  };

  const applySuggestion = (patch: Partial<Record<keyof Filters, string | null>>) => {
    const newFilters = { ...filters };
    Object.keys(patch).forEach(key => {
      if (patch[key as keyof Filters] === null) {
        newFilters[key as keyof Filters] = '';
      } else {
        newFilters[key as keyof Filters] = patch[key as keyof Filters] as string;
      }
    });
    setFilters(newFilters);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-indigo-600 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-white text-xl font-bold hover:text-indigo-100">
                HelpingHandVI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/provider/login"
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Provider Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Find Providers</h1>
      <p className="text-gray-600 mb-8">Your backup plan when your usual guy doesn't answer.</p>

      {emergencyMode.enabled && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                High demand — response times may be limited. Confirm details directly with the provider.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select
          value={filters.island}
          onChange={(e) => handleFilterChange('island', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Islands</option>
          <option value="STT">St. Thomas</option>
          <option value="STJ">St. John</option>
          <option value="STX">St. Croix</option>
        </select>

        <select
          value={filters.categoryId}
          onChange={(e) => handleFilterChange('categoryId', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {availableCategories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Availability</option>
          <option value="OPEN_NOW">Open Now</option>
          <option value="BUSY_LIMITED">Busy / Limited</option>
          <option value="NOT_TAKING_WORK">Not Taking Work</option>
        </select>
      </div>

      {providers.length === 0 && suggestions.length > 0 && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 mb-4">No matches for these filters.</p>
          <div className="space-y-2">
            {suggestions.map(suggestion => (
              <button
                key={suggestion.id}
                onClick={() => applySuggestion(suggestion.patch)}
                className="block w-full text-left p-2 bg-white border rounded hover:bg-gray-50"
              >
                <strong>{suggestion.label}</strong>
                {suggestion.description && <p className="text-sm text-gray-600">{suggestion.description}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      <DisclaimerNotice variant="compact" className="mb-6" />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <Card key={provider.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{provider.name}</h2>
              {provider.lifecycle_status === 'INACTIVE' && (
                <Badge label="Inactive" variant="secondary" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{getIslandDisplayName(provider.island)}</p>
            {provider.categories && provider.categories.length > 0 && (
              <p className="text-sm text-gray-500 mb-2">{provider.categories.join(', ')}</p>
            )}
            {provider.profile?.description && (
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                {provider.profile.description.length > 100
                  ? `${provider.profile.description.substring(0, 100)}...`
                  : provider.profile.description}
              </p>
            )}
            <Badge label={provider.status} variant={getAvailabilityColor(provider.status)} className="mb-2" />
            {provider.is_premium_active && (
              <Badge label={provider.is_trial ? "Trial" : "Premium"} variant="success" className="mb-2 ml-2" />
            )}
            <p className="text-sm text-gray-500 mb-4">
              Activity: {provider.last_active_at ? getHoursAgo(provider.last_active_at) : 'Never'}
            </p>
            <div className="flex space-x-2">
              <Button href={`tel:${provider.phone}`}>Call</Button>
              <Button
                href={provider.whatsapp ? `https://wa.me/${provider.whatsapp}` : `sms:${provider.phone}`}
                variant="secondary"
              >
                {provider.whatsapp ? 'WhatsApp' : 'SMS'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <Button onClick={() => fetchProviders(false)} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
      </div>
    </div>
  );
};