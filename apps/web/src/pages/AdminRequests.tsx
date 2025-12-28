import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';

interface ChangeRequest {
  id: number;
  provider_id: number;
  provider_name: string;
  field: 'name' | 'island';
  current_value: string;
  requested_value: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export const AdminRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      navigate('/admin/login');
      return;
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll show mock data
      const mockRequests: ChangeRequest[] = [
        {
          id: 1,
          provider_id: 1,
          provider_name: 'John Doe',
          field: 'name',
          current_value: 'John Doe',
          requested_value: 'John Doe\'s Plumbing',
          reason: 'Want to make business name more professional',
          status: 'pending',
          created_at: '2025-12-27T10:00:00Z'
        },
        {
          id: 2,
          provider_id: 2,
          provider_name: 'Jane Smith',
          field: 'island',
          current_value: 'STT',
          requested_value: 'STJ',
          reason: 'Moved to St. John and need to update location',
          status: 'pending',
          created_at: '2025-12-26T15:30:00Z'
        }
      ];
      setRequests(mockRequests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      // In a real implementation, this would call an API to approve the request
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: 'Admin' }
          : req
      ));
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      // In a real implementation, this would call an API to reject the request
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: 'Admin' }
          : req
      ));
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const filteredRequests = requests.filter(req => filter === 'all' || req.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge label="Pending" variant="warning" />;
      case 'approved': return <Badge label="Approved" variant="success" />;
      case 'rejected': return <Badge label="Rejected" variant="error" />;
      default: return <Badge label={status} variant="secondary" />;
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard - Requests</h1>
            <div className="flex space-x-4">
              <a href="/admin/providers" className="text-blue-600 hover:underline">Providers</a>
              <a href="/admin/requests" className="text-blue-600 hover:underline font-semibold">Requests</a>
              <a href="/admin/reports" className="text-blue-600 hover:underline">Reports</a>
              <a href="/admin/settings" className="text-blue-600 hover:underline">Settings</a>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_logged_in');
                  navigate('/admin/login');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Pending ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Approved ({requests.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Rejected ({requests.filter(r => r.status === 'rejected').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              All ({requests.length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No {filter === 'all' ? '' : filter} requests found
            </Card>
          ) : (
            filteredRequests.map(request => (
              <Card key={request.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{request.provider_name}</h3>
                    <p className="text-sm text-gray-600">
                      Request #{request.id} • {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      {request.field === 'name' ? 'Business Name' : 'Location'} Change
                    </h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Current: <strong>{request.current_value}</strong></p>
                      <p className="text-sm text-green-600">Requested: <strong>{request.requested_value}</strong></p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Reason</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{request.reason}</p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      variant="primary"
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      variant="secondary"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {request.reviewed_at && (
                  <div className="mt-4 text-sm text-gray-600">
                    Reviewed by {request.reviewed_by} on {new Date(request.reviewed_at).toLocaleDateString()}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};