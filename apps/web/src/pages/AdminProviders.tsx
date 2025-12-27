import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface Provider {
  id: number;
  name: string;
  phone: string;
  island: string;
  status: string;
  archived: boolean;
  badges: string[];
  is_disputed: boolean;
  disputed_at: string | null;
}

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
const ADMIN_KEY = 'admin-secret'; // In real app, from env

const getIslandDisplayName = (islandCode: string) => {
  switch (islandCode) {
    case 'STT': return 'St. Thomas';
    case 'STJ': return 'St. John';
    case 'STX': return 'St. Croix';
    default: return islandCode;
  }
};

export const AdminProviders: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    island: '',
    category: '',
    status: '',
  });

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      navigate('/admin/login');
      return;
    }
    fetchProviders();
  }, [filters]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.island) params.append('island', filters.island);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`${API_BASE}/admin/providers?${params}`, {
        headers: { 'X-ADMIN-KEY': ADMIN_KEY },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      alert('Error fetching providers');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: number) => {
    const notes = prompt('Notes:');
    if (notes !== null) {
      try {
        await fetch(`${API_BASE}/admin/providers/${id}/verify`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
          body: JSON.stringify({ notes }),
        });
        fetchProviders();
      } catch (err) {
        alert('Error verifying');
      }
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await fetch(`${API_BASE}/admin/providers/${id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
      });
      fetchProviders();
    } catch (err) {
      alert('Error updating');
    }
  };

  const handleDisputed = async (id: number, isDisputed: boolean) => {
    const notes = prompt('Notes:');
    if (notes !== null) {
      try {
        await fetch(`${API_BASE}/admin/providers/${id}/disputed`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
          body: JSON.stringify({ isDisputed, notes }),
        });
        fetchProviders();
      } catch (err) {
        alert('Error updating disputed status');
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin - Providers</h1>
      
      <div className="mb-8">
        <nav className="flex space-x-4">
          <a href="/admin/providers" className="text-blue-600 hover:underline">Providers</a>
          <a href="/admin/reports" className="text-blue-600 hover:underline">Reports</a>
          <a href="/admin/settings" className="text-blue-600 hover:underline">Settings</a>
        </nav>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="TODAY">Today</option>
          <option value="NEXT_3_DAYS">Next 3 Days</option>
          <option value="THIS_WEEK">This Week</option>
          <option value="NEXT_WEEK">Next Week</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Island</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Badges</th>
              <th className="px-4 py-2 border">Archived</th>
              <th className="px-4 py-2 border">Disputed</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(provider => (
              <tr key={provider.id}>
                <td className="px-4 py-2 border">{provider.name}</td>
                <td className="px-4 py-2 border">{provider.phone}</td>
                <td className="px-4 py-2 border">{getIslandDisplayName(provider.island)}</td>
                <td className="px-4 py-2 border">
                  <Badge label={provider.status} variant="info" />
                </td>
                <td className="px-4 py-2 border">
                  {provider.badges?.filter(b => b).map(badge => (
                    <Badge key={badge} label={badge} variant="success" className="mr-1" />
                  ))}
                </td>
                <td className="px-4 py-2 border">{provider.archived ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 border">
                  {provider.is_disputed && <Badge label="Disputed" variant="error" />}
                </td>
                <td className="px-4 py-2 border">
                  <Button onClick={() => handleVerify(provider.id)} className="mr-2">Verify</Button>
                  <Button onClick={() => handleArchive(provider.id)} className="mr-2">
                    {provider.archived ? 'Unarchive' : 'Archive'}
                  </Button>
                  <Button onClick={() => handleDisputed(provider.id, !provider.is_disputed)} variant="secondary">
                    {provider.is_disputed ? 'Unmark Disputed' : 'Mark Disputed'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};