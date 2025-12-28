import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AdminLayout } from '../components/AdminLayout';

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
  const [allRequests, setAllRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      navigate('/admin/login');
      return;
    }
    fetchAllRequests();
  }, [navigate]);

  useEffect(() => {
    // Update filtered requests when filter changes or all requests change
    const filtered = filter === 'all' ? allRequests : allRequests.filter(req => req.status === filter);
    setRequests(filtered);
  }, [filter, allRequests]);

  const fetchAllRequests = async () => {
    try {
      const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
      const ADMIN_KEY = 'admin-secret'; // In real app, from env

      const response = await fetch(`${API_BASE}/admin/change-requests?status=`, {
        headers: { 'X-ADMIN-KEY': ADMIN_KEY },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setAllRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
      const ADMIN_KEY = 'admin-secret'; // In real app, from env

      const response = await fetch(`${API_BASE}/admin/change-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-KEY': ADMIN_KEY
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }

      // Refresh the requests list
      await fetchAllRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
      const ADMIN_KEY = 'admin-secret'; // In real app, from env

      const adminNotes = prompt('Optional notes for rejection:');
      if (adminNotes === null) return; // User cancelled

      const response = await fetch(`${API_BASE}/admin/change-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-KEY': ADMIN_KEY
        },
        body: JSON.stringify({ action: 'reject', admin_notes: adminNotes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject request');
      }

      // Refresh the requests list
      await fetchAllRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request');
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

  if (loading) {
    return (
      <AdminLayout title="Requests">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Requests">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'pending').length}
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
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Requests</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            size="sm"
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </Button>
          <Button
            onClick={() => setFilter('approved')}
            variant={filter === 'approved' ? 'primary' : 'secondary'}
            size="sm"
          >
            Approved ({requests.filter(r => r.status === 'approved').length})
          </Button>
          <Button
            onClick={() => setFilter('rejected')}
            variant={filter === 'rejected' ? 'primary' : 'secondary'}
            size="sm"
          >
            Rejected ({requests.filter(r => r.status === 'rejected').length})
          </Button>
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
          >
            All ({requests.length})
          </Button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-6">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filter === 'all' ? '' : filter} requests found
            </h3>
            <p className="text-gray-600">
              {filter === 'pending'
                ? 'All requests have been reviewed.'
                : 'Try selecting a different filter to see more requests.'
              }
            </p>
          </div>
        ) : (
          filteredRequests.map(request => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{request.provider_name}</h3>
                    <p className="text-sm text-gray-600">
                      Request #{request.id} • Submitted {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {request.field === 'name' ? 'Business Name' : 'Location'} Change Request
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{request.current_value}</p>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Requested</span>
                        <p className="text-sm font-medium text-green-900 mt-1">{request.requested_value}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Reason for Change</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{request.reason}</p>
                    </div>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      variant="primary"
                      size="sm"
                    >
                      ✅ Approve Request
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      variant="secondary"
                      size="sm"
                    >
                      ❌ Reject Request
                    </Button>
                  </div>
                )}

                {request.reviewed_at && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Reviewed by <span className="font-medium">{request.reviewed_by}</span> on{' '}
                      {new Date(request.reviewed_at).toLocaleDateString()} at{' '}
                      {new Date(request.reviewed_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};