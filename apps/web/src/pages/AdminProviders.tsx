import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AdminLayout } from '../components/AdminLayout';
import { API_BASE } from '../constants';

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
    verified: '',
    govApproved: '',
    archived: '',
    disputed: '',
  });
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.island) params.append('island', filters.island);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.status) params.append('status', filters.status);
      if (filters.verified) params.append('verified', filters.verified);
      if (filters.govApproved) params.append('govApproved', filters.govApproved);
      if (filters.archived) params.append('archived', filters.archived);
      if (filters.disputed) params.append('disputed', filters.disputed);

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
    const provider = providers.find(p => p.id === id);
    const isCurrentlyVerified = provider?.badges?.includes('VERIFIED') || false;
    const verified = !isCurrentlyVerified;

    try {
      await fetch(`${API_BASE}/admin/providers/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
        body: JSON.stringify({ verified }),
      });
      fetchProviders();
    } catch (err) {
      alert('Error verifying');
    }
  };

  const handleGovApprove = async (id: number) => {
    const provider = providers.find(p => p.id === id);
    const isCurrentlyApproved = provider?.badges?.includes('GOV_APPROVED') || false;
    const approved = !isCurrentlyApproved;

    try {
      await fetch(`${API_BASE}/admin/providers/${id}/gov-approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
        body: JSON.stringify({ approved }),
      });
      fetchProviders();
    } catch (err) {
      alert('Error updating government approval');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/admin/providers/${id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
      });
      if (!response.ok) throw new Error('Failed to update archive status');
      fetchProviders();
    } catch (err) {
      alert('Error updating archive status');
    }
  };

  const handleDisputed = async (id: number, isDisputed: boolean) => {
    const notes = prompt('Notes:');
    if (notes !== null) {
      try {
        const response = await fetch(`${API_BASE}/admin/providers/${id}/disputed`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
          body: JSON.stringify({ isDisputed, notes }),
        });
        if (!response.ok) throw new Error('Failed to update disputed status');
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{providers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-xl sm:text-2xl">✅</span>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {providers.filter(p => !p.archived).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-xl sm:text-2xl">⚠️</span>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Disputed</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {providers.filter(p => p.is_disputed).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-xl sm:text-2xl">📦</span>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Archived</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {providers.filter(p => p.archived).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Island</label>
            <select
              value={filters.island}
              onChange={(e) => handleFilterChange('island', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="OPEN_NOW">Available Now</option>
              <option value="BUSY_LIMITED">Busy/Limited</option>
              <option value="NOT_TAKING_WORK">Not Taking Work</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
            <select
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Providers</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gov Approval</label>
            <select
              value={filters.govApproved}
              onChange={(e) => handleFilterChange('govApproved', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Providers</option>
              <option value="true">Gov Approved Only</option>
              <option value="false">Not Gov Approved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Archive Status</label>
            <select
              value={filters.archived}
              onChange={(e) => handleFilterChange('archived', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Providers</option>
              <option value="true">Archived Only</option>
              <option value="false">Active Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dispute Status</label>
            <select
              value={filters.disputed}
              onChange={(e) => handleFilterChange('disputed', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Providers</option>
              <option value="true">Disputed Only</option>
              <option value="false">Not Disputed</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ island: '', categoryId: '', status: '', verified: '', govApproved: '', archived: '', disputed: '' })}
              variant="secondary"
              className="w-full"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Provider Management</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage provider accounts, verification status, and disputes
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleVerify(provider.id)}
                        size="sm"
                        variant="primary"
                      >
                        {provider.badges?.includes('VERIFIED') ? 'Unverify' : 'Verify'}
                      </Button>
                      <Button
                        onClick={() => handleGovApprove(provider.id)}
                        size="sm"
                        variant={provider.badges?.includes('GOV_APPROVED') ? "primary" : "secondary"}
                      >
                        {provider.badges?.includes('GOV_APPROVED') ? 'Gov Approved' : 'Gov Approve'}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {providers.map(provider => (
              <div key={provider.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{provider.name}</h4>
                    <p className="text-sm text-gray-600">{provider.phone}</p>
                    <p className="text-sm text-gray-600">{getIslandDisplayName(provider.island)}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge
                      label={provider.status.replace('_', ' ')}
                      variant={
                        provider.status === 'OPEN_NOW' ? 'success' :
                        provider.status === 'BUSY_LIMITED' ? 'warning' : 'secondary'
                      }
                    />
                    {provider.archived && (
                      <Badge label="Archived" variant="secondary" />
                    )}
                    {provider.is_disputed && (
                      <Badge label="Disputed" variant="error" />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {provider.badges?.filter(b => b).map(badge => (
                    <Badge key={badge} label={badge} variant="success" />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleVerify(provider.id)}
                    size="sm"
                    variant="primary"
                  >
                    {provider.badges?.includes('VERIFIED') ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button
                    onClick={() => handleGovApprove(provider.id)}
                    size="sm"
                    variant={provider.badges?.includes('GOV_APPROVED') ? "primary" : "secondary"}
                  >
                    {provider.badges?.includes('GOV_APPROVED') ? 'Gov Approved' : 'Gov Approve'}
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {providers.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-3xl sm:text-4xl mb-4">📋</div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No providers found</h3>
            <p className="text-sm sm:text-base text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};