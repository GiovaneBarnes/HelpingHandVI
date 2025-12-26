import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

interface Provider {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  island: string;
  profile: any;
  status: string;
  last_active_at: string;
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

const getHoursAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  return diffHours;
};

export const ProviderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProvider(id);
    }
  }, [id]);

  const fetchProvider = async (providerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/providers/${providerId}`);
      if (!response.ok) throw new Error('Failed to fetch provider');
      const data = await response.json();
      setProvider(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!provider) return;
    const reason = prompt('Reason for reporting:');
    if (reason) {
      const contact = prompt('Optional contact info:');
      try {
        await fetch(`${API_BASE}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider_id: provider.id, reason, contact }),
        });
        alert('Report submitted');
      } catch (err) {
        alert('Error submitting report');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div>Loading...</div>
      ) : provider ? (
        <Card className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{provider.name}</h1>
          <p className="text-gray-600 mb-2">{provider.island}</p>
          <Badge label={provider.status} variant={getAvailabilityColor(provider.status)} className="mb-4" />
          <p className="text-sm text-gray-500 mb-4">
            Last active: {provider.last_active_at ? `${getHoursAgo(provider.last_active_at)} hours ago` : 'Never'}
          </p>
          <Button onClick={handleReport} variant="secondary" className="mb-4">Report this listing</Button>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Profile</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(provider.profile, null, 2)}</pre>
          </div>
          <div className="flex space-x-4">
            <Button href={`tel:${provider.phone}`}>Call {provider.phone}</Button>
            <Button
              href={provider.whatsapp ? `https://wa.me/${provider.whatsapp}` : `sms:${provider.phone}`}
              variant="secondary"
            >
              {provider.whatsapp ? `WhatsApp ${provider.whatsapp}` : `SMS ${provider.phone}`}
            </Button>
          </div>
        </Card>
      ) : (
        <div>Provider not found</div>
      )}
    </div>
  );
};