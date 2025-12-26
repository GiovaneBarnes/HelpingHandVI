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
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    island: '',
    category: '',
    availability: '',
    activeWithinHours: '',
  });

  useEffect(() => {
    fetchProviders();
  }, [filters]);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.island) params.append('island', filters.island);
      if (filters.category) params.append('category', filters.category);
      if (filters.availability) params.append('status', filters.availability);
      if (filters.activeWithinHours) params.append('activeWithinHours', filters.activeWithinHours);

      const response = await fetch(`${API_BASE}/providers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Find Providers</h1>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.island}
          onChange={(e) => handleFilterChange('island', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Islands</option>
          <option value="St. Thomas">St. Thomas</option>
          <option value="St. John">St. John</option>
          <option value="St. Croix">St. Croix</option>
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

        <input
          type="number"
          placeholder="Active within hours"
          value={filters.activeWithinHours}
          onChange={(e) => handleFilterChange('activeWithinHours', e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <Card key={provider.id} className="hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">{provider.name}</h2>
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
    </div>
  );
};