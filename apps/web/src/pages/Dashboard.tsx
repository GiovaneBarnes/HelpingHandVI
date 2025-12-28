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
  plan: string;
  plan_source: string;
  trial_end_at?: string;
  is_premium_active: boolean;
  trial_days_left: number;
  is_trial: boolean;
  categories: string[];
  areas: Array<{ id: number; name: string; island: string }>;
  contact_call_enabled: boolean;
  contact_whatsapp_enabled: boolean;
  contact_sms_enabled: boolean;
  preferred_contact_method?: string;
  typical_hours?: string;
  emergency_calls_accepted: boolean;
}

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

const getAvailabilityColor = (status: string) => {
  switch (status) {
    case 'OPEN_NOW': return 'success';
    case 'BUSY_LIMITED': return 'warning';
    case 'NOT_TAKING_WORK': return 'error';
    default: return 'secondary';
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
    areas: [] as number[],
    contact_call_enabled: true,
    contact_whatsapp_enabled: true,
    contact_sms_enabled: true,
    preferred_contact_method: '',
    typical_hours: '',
    emergency_calls_accepted: false,
  });
  const [availableAreas, setAvailableAreas] = useState<Array<{ id: number; name: string }>>([]);
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
        areas: data.areas?.map((a: any) => a.id) || [],
        contact_call_enabled: data.contact_call_enabled ?? true,
        contact_whatsapp_enabled: data.contact_whatsapp_enabled ?? true,
        contact_sms_enabled: data.contact_sms_enabled ?? true,
        preferred_contact_method: data.preferred_contact_method || '',
        typical_hours: data.typical_hours || '',
        emergency_calls_accepted: data.emergency_calls_accepted ?? false,
      });
      setStatus(data.status);
      if (data.island) {
        await fetchAreas(data.island);
      }
    } catch (err) {
      alert('Error fetching provider');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async (island: string) => {
    try {
      const response = await fetch(`${API_BASE}/areas?island=${island}`);
      if (response.ok) {
        const areas = await response.json();
        setAvailableAreas(areas);
      }
    } catch (err) {
      console.error('Failed to fetch areas');
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

        {/* Trial/Premium Status Card */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            {provider.is_trial && provider.trial_days_left > 0
              ? `Premium Trial: ${provider.trial_days_left} days left`
              : provider.is_premium_active
                ? 'Premium Plan'
                : 'Free Plan'
            }
          </h3>
          <p className="text-sm text-blue-700">
            No card required. Your listing stays active either way.
          </p>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Current Status</h2>
          <Badge label={provider.status} variant={getAvailabilityColor(provider.status)} />
          {provider.is_premium_active && (
            <Badge label={provider.is_trial ? "Trial" : "Premium"} variant="success" className="ml-2" />
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Update Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="OPEN_NOW">Available Now</option>
            <option value="BUSY_LIMITED">Busy/Limited</option>
            <option value="NOT_TAKING_WORK">Not Taking Work</option>
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
                <option value="STT">St. Thomas</option>
                <option value="STJ">St. John</option>
                <option value="STX">St. Croix</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Service Areas</label>
              {availableAreas.map(area => (
                <label key={area.id} className="block">
                  <input
                    type="checkbox"
                    checked={form.areas.includes(area.id)}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      areas: e.target.checked
                        ? [...prev.areas, area.id]
                        : prev.areas.filter(id => id !== area.id),
                    }))}
                  /> {area.name}
                </label>
              ))}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Contact Preferences</h3>
              <div className="space-y-2">
                <label className="block">
                  <input
                    type="checkbox"
                    checked={form.contact_call_enabled}
                    onChange={(e) => setForm(prev => ({ ...prev, contact_call_enabled: e.target.checked }))}
                  /> Enable Call button
                </label>
                <label className="block">
                  <input
                    type="checkbox"
                    checked={form.contact_whatsapp_enabled}
                    onChange={(e) => setForm(prev => ({ ...prev, contact_whatsapp_enabled: e.target.checked }))}
                  /> Enable WhatsApp button
                </label>
                <label className="block">
                  <input
                    type="checkbox"
                    checked={form.contact_sms_enabled}
                    onChange={(e) => setForm(prev => ({ ...prev, contact_sms_enabled: e.target.checked }))}
                  /> Enable SMS button
                </label>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Preferred Contact Method</label>
                <select
                  value={form.preferred_contact_method}
                  onChange={(e) => setForm(prev => ({ ...prev, preferred_contact_method: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {form.contact_call_enabled && <option value="CALL">Call</option>}
                  {form.contact_whatsapp_enabled && <option value="WHATSAPP">WhatsApp</option>}
                  {form.contact_sms_enabled && <option value="SMS">SMS</option>}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Work Information</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Typical Hours</label>
                <input
                  type="text"
                  value={form.typical_hours}
                  onChange={(e) => setForm(prev => ({ ...prev, typical_hours: e.target.value }))}
                  placeholder="e.g., Mon-Fri 8AM-5PM, Sat 9AM-1PM"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <label className="block">
                <input
                  type="checkbox"
                  checked={form.emergency_calls_accepted}
                  onChange={(e) => setForm(prev => ({ ...prev, emergency_calls_accepted: e.target.checked }))}
                /> Accept emergency calls
              </label>
            </div>

            <Button onClick={handleUpdateProfile}>Save Changes</Button>
          </div>
        )}
      </Card>
    </div>
  );
};