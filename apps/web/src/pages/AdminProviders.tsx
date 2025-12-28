import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AdminLayout } from '../components/AdminLayout';

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
    categoryId: '',
    status: '',
  });
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.island) params.append('island', filters.island);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
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
  }, [filters]);

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      navigate('/admin/login');
      return;
    }
    fetchCategories();
    fetchProviders();
  }, [filters, navigate, fetchProviders]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        const categories = await response.json();
        setAvailableCategories(categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
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

  if (loading) {
    return (
      <AdminLayout title="Providers">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading providers...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Providers">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Providers</p>
              <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {providers.filter(p => !p.archived).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disputed</p>
              <p className="text-2xl font-bold text-gray-900">
                {providers.filter(p => p.is_disputed).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-900">
                {providers.filter(p => p.archived).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Island</label>
            <select
              value={filters.island}
              onChange={(e) => handleFilterChange('island', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Islands</option>
              <option value="STT">St. Thomas</option>
              <option value="STJ">St. John</option>
              <option value="STX">St. Croix</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="OPEN_NOW">Available Now</option>
              <option value="BUSY_LIMITED">Busy/Limited</option>
              <option value="NOT_TAKING_WORK">Not Taking Work</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ island: '', categoryId: '', status: '' })}
              variant="secondary"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Provider Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage provider accounts, verification status, and disputes
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map(provider => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{provider.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getIslandDisplayName(provider.island)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      label={provider.status.replace('_', ' ')}
                      variant={
                        provider.status === 'OPEN_NOW' ? 'success' :
                        provider.status === 'BUSY_LIMITED' ? 'warning' : 'secondary'
                      }
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {provider.badges?.filter(b => b).map(badge => (
                        <Badge key={badge} label={badge} variant="success" />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {provider.archived && (
                        <Badge label="Archived" variant="secondary" />
                      )}
                      {provider.is_disputed && (
                        <Badge label="Disputed" variant="error" />
                      )}
                      {!provider.archived && !provider.is_disputed && (
                        <Badge label="Active" variant="success" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      onClick={() => handleVerify(provider.id)}
                      size="sm"
                      variant="primary"
                    >
                      Verify
                    </Button>
                    <Button
                      onClick={() => handleArchive(provider.id)}
                      size="sm"
                      variant={provider.archived ? "primary" : "secondary"}
                    >
                      {provider.archived ? 'Unarchive' : 'Archive'}
                    </Button>
                    <Button
                      onClick={() => handleDisputed(provider.id, !provider.is_disputed)}
                      size="sm"
                      variant={provider.is_disputed ? "primary" : "secondary"}
                    >
                      {provider.is_disputed ? 'Resolve' : 'Flag'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {providers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};