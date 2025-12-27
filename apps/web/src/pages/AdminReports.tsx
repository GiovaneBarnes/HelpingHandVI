import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';

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

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      window.location.href = '/admin/login';
      return;
    }
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
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
  };

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

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin - Reports</h1>
      
      <div className="mb-8">
        <nav className="flex space-x-4">
          <a href="/admin/providers" className="text-blue-600 hover:underline">Providers</a>
          <a href="/admin/reports" className="text-blue-600 hover:underline">Reports</a>
          <a href="/admin/settings" className="text-blue-600 hover:underline">Settings</a>
        </nav>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status (default: NEW + IN_REVIEW)</option>
          <option value="NEW">New</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ALL">All Status</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="WRONG_NUMBER">Wrong Number</option>
          <option value="NOT_IN_BUSINESS">Not in Business</option>
          <option value="UNSAFE_SCAM">Unsafe/Scam</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Provider</th>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Reason</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Contact</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td className="px-4 py-2 border">{report.provider_name}</td>
                <td className="px-4 py-2 border">{report.report_type}</td>
                <td className="px-4 py-2 border">{report.reason}</td>
                <td className="px-4 py-2 border">
                  <select
                    value={report.status}
                    onChange={(e) => handleStatusChange(report.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="NEW">New</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </td>
                <td className="px-4 py-2 border">{report.contact || 'N/A'}</td>
                <td className="px-4 py-2 border">{new Date(report.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 border">
                  <Button onClick={() => handleArchive(report.provider_id)}>Archive Provider</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};