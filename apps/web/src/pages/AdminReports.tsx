import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AdminLayout } from '../components/AdminLayout';

interface Report {
  id: number;
  provider_id: number;
  provider_name: string;
  reason: string;
  contact?: string;
  created_at: string;
  report_type: string;
  status: string;
  admin_notes?: string;
  updated_at: string;
}

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
const ADMIN_KEY = 'admin-secret'; // In real app, from env

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);

      const response = await fetch(`${API_BASE}/admin/reports?${params}`, {
        headers: { 'X-ADMIN-KEY': ADMIN_KEY },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setReports(data);
    } catch (err) {
      alert('Error fetching reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      window.location.href = '/admin/login';
      return;
    }
    fetchReports();
  }, [filters, fetchReports]);

  const handleArchive = async (providerId: number) => {
    if (confirm('Archive this provider?')) {
      try {
        await fetch(`${API_BASE}/admin/providers/${providerId}/archive`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
        });
        alert('Provider archived');
        fetchReports(); // Refresh
      } catch (err) {
        alert('Error archiving');
      }
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    const adminNotes = prompt('Admin notes (optional):');
    if (adminNotes !== null) {
      try {
        await fetch(`${API_BASE}/admin/reports/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
          body: JSON.stringify({ status: newStatus, adminNotes }),
        });
        fetchReports(); // Refresh
      } catch (err) {
        alert('Error updating report status');
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout title="Reports">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading reports...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reports">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🆕</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'NEW').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🔍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'IN_REVIEW').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'RESOLVED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status (default: NEW + IN_REVIEW)</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ALL">All Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="WRONG_NUMBER">Wrong Number</option>
              <option value="NOT_IN_BUSINESS">Not in Business</option>
              <option value="UNSAFE_SCAM">Unsafe/Scam</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ status: '', type: '' })}
              variant="secondary"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Report Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Review and manage provider reports and complaints
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.provider_name}</div>
                    <div className="text-sm text-gray-500">ID: {report.provider_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      label={report.report_type.replace('_', ' ')}
                      variant={
                        report.report_type === 'UNSAFE_SCAM' ? 'error' :
                        report.report_type === 'NOT_IN_BUSINESS' ? 'warning' : 'secondary'
                      }
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={report.reason}>
                      {report.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.contact || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => handleArchive(report.provider_id)}
                      size="sm"
                      variant="secondary"
                    >
                      Archive Provider
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};