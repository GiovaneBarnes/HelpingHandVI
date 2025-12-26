import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';

interface Report {
  id: number;
  provider_id: number;
  provider_name: string;
  reason: string;
  contact?: string;
  created_at: string;
}

const API_BASE = 'http://localhost:3000';
const ADMIN_KEY = 'admin-secret'; // In real app, from env

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      window.location.href = '/admin/login';
      return;
    }
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/reports`, {
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
          body: JSON.stringify({ archived: true }),
        });
        alert('Provider archived');
        fetchReports(); // Refresh
      } catch (err) {
        alert('Error archiving');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin - Reports</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Provider</th>
              <th className="px-4 py-2 border">Reason</th>
              <th className="px-4 py-2 border">Contact</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td className="px-4 py-2 border">{report.provider_name}</td>
                <td className="px-4 py-2 border">{report.reason}</td>
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