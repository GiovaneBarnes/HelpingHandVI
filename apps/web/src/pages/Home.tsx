import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

interface Provider {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  island: string;
  profile: any;
  status: string;
  last_active_at: string;
  lifecycle_status: string;
}

const API_BASE = 'http://localhost:3000';

const getAvailabilityColor = (status: string) => {
  switch (status) {
    case 'TODAY': return 'success';
    case 'NEXT_3_DAYS': return 'warning';
    case 'THIS_WEEK': return 'info';
    case 'NEXT_WEEK': return 'secondary';
    default: return 'error';
  }
};

const getHoursAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  return diffHours;
};

export const Home: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    island: '',
    category: '',
    availability: '',
    areaId: '',
  });
  const [availableAreas, setAvailableAreas] = useState<Array<{ id: number; name: string }>>([]);
  const [emergencyMode, setEmergencyMode] = useState({ enabled: false });

  useEffect(() => {
    fetchProviders(true);
    fetchEmergencyMode();
  }, [filters]);

  useEffect(() => {
    if (filters.island) {
      fetchAreas();
    } else {
      setAvailableAreas([]);
      setFilters(prev => ({ ...prev, areaId: '' }));
    }
  }, [filters.island]);

  const fetchAreas = async () => {
    try {
      const response = await fetch(`${API_BASE}/areas?island=${filters.island}`);
      if (response.ok) {
        const areas = await response.json();
        setAvailableAreas(areas);
      }
    } catch (err) {
      console.error('Failed to fetch areas');
    }
  };

  const fetchEmergencyMode = async () => {
    try {
      const response = await fetch(`${API_BASE}/settings/emergency-mode`);
      if (response.ok) {
        const data = await response.json();
        setEmergencyMode(data);
      }
    } catch (err) {
      console.error('Failed to fetch emergency mode');
    }
  };

  const fetchProviders = async (reset = false) => {
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
      if (filters.category) params.append('category', filters.category);
      if (filters.availability) params.append('status', filters.availability);
      if (filters.areaId) params.append('areaId', filters.areaId);
      if (!reset && cursor) params.append('cursor', cursor);

      const response = await fetch(`${API_BASE}/providers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (reset) {
        setProviders(data.data.providers);
      } else {
        setProviders(prev => [...prev, ...data.data.providers]);
      }
      setCursor(data.data.nextCursor);
      setHasMore(!!data.data.nextCursor);
      if (reset && data.data.providers.length === 0) {
        setSuggestions(data.data.suggestions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applySuggestion = (patch: any) => {
    const newFilters = { ...filters };
    Object.keys(patch).forEach(key => {
      if (patch[key] === null) {
        newFilters[key as keyof typeof newFilters] = '';
      } else {
        newFilters[key as keyof typeof newFilters] = patch[key];
      }
    });
    setFilters(newFilters);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
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
              <h3 className="text-sm font-medium text-yellow-800">
                High demand — response times may be limited
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Confirm details directly with providers. Emergency services are prioritized.</p>
              </div>
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
          value={filters.areaId}
          onChange={(e) => handleFilterChange('areaId', e.target.value)}
          className="border rounded px-3 py-2"
          disabled={!filters.island}
        >
          <option value="">All Areas</option>
          {availableAreas.map(area => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          <option value="Electrician">Electrician</option>
          <option value="Plumber">Plumber</option>
          {/* Add more */}
        </select>

        <select
          value={filters.availability}
          onChange={(e) => handleFilterChange('availability', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Availability</option>
          <option value="TODAY">Today</option>
          <option value="NEXT_3_DAYS">Next 3 Days</option>
          <option value="THIS_WEEK">This Week</option>
          <option value="NEXT_WEEK">Next Week</option>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <Card key={provider.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{provider.name}</h2>
              {provider.lifecycle_status === 'INACTIVE' && (
                <Badge label="Inactive" variant="secondary" />
              )}
            </div>
            <p className="text-gray-600 mb-2">{provider.island}</p>
            <Badge label={provider.status} variant={getAvailabilityColor(provider.status)} className="mb-2" />
            <p className="text-sm text-gray-500 mb-4">
              Last active: {provider.last_active_at ? `${getHoursAgo(provider.last_active_at)} hours ago` : 'Never'}
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
            <Link to={`/provider/${provider.id}`} className="text-blue-600 hover:underline mt-2 block">
              View Details
            </Link>
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
  );
};