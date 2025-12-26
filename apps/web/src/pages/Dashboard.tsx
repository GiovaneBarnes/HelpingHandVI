import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface Provider {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  island: string;
  status: string;
  is_premium: boolean;
  trial_days_left: number;
  categories: string[];
  areas: { island: string; neighborhood: string }[];
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

export const Dashboard: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    island: '',
    categories: [] as string[],
    areas: [] as { island: string; neighborhood: string }[],
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (providerId) {
      fetchProvider();
    }
  }, [providerId]);

  const fetchProvider = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/providers/${providerId}`);
      if (!response.ok) throw new Error('Failed to fetch provider');
      const data = await response.json();
      setProvider(data);
      setForm({
        name: data.name,
        phone: data.phone,
        whatsapp: data.whatsapp || '',
        island: data.island,
        categories: [], // Would need to fetch from joins
        areas: [], // Same
      });
      setStatus(data.status);
    } catch (err) {
      alert('Error fetching provider');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Failed to update');
      setEditing(false);
      fetchProvider();
    } catch (err) {
      alert('Error updating profile');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/providers/${providerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      fetchProvider();
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!provider) return <div className="text-center py-8">Provider not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p>Token: {token}</p>

        <div className="mb-4">
          {provider.is_premium && provider.trial_days_left > 0 && (
            <Badge label={`Founding trial: ${provider.trial_days_left} days left`} variant="warning" className="ml-2" />
          )}
          <h2 className="text-xl font-semibold mb-2">Current Status</h2>
          <Badge label={provider.status} variant={getAvailabilityColor(provider.status)} />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Update Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="TODAY">Today</option>
            <option value="NEXT_3_DAYS">Next 3 Days</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="NEXT_WEEK">Next Week</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
          <Button onClick={handleUpdateStatus} className="ml-2">Update Status</Button>
        </div>

        <div className="mb-4">
          <Button onClick={() => setEditing(!editing)}>Edit Profile</Button>
        </div>

        {editing && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Island</label>
              <select
                value={form.island}
                onChange={(e) => setForm(prev => ({ ...prev, island: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="St. Thomas">St. Thomas</option>
                <option value="St. John">St. John</option>
                <option value="St. Croix">St. Croix</option>
              </select>
            </div>
            <Button onClick={handleUpdateProfile}>Save Changes</Button>
          </div>
        )}
      </Card>
    </div>
  );
};