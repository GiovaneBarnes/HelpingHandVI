import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { DisclaimerNotice } from '../components/DisclaimerNotice';

interface Provider {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  island: string;
  profile: any;
  status: string;
  last_active_at: string;
  plan: string;
  is_premium_active: boolean;
  is_trial: boolean;
  contact_call_enabled: boolean;
  contact_whatsapp_enabled: boolean;
  contact_sms_enabled: boolean;
  preferred_contact_method?: string;
  typical_hours?: string;
  emergency_calls_accepted: boolean;
  areas: Array<{ id: number; name: string; island: string }>;
}

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

const getIslandDisplayName = (islandCode: string) => {
  switch (islandCode) {
    case 'STT': return 'St. Thomas';
    case 'STJ': return 'St. John';
    case 'STX': return 'St. Croix';
    default: return islandCode;
  }
};

const getAvailabilityColor = (status: string) => {
  switch (status) {
    case 'OPEN_NOW': return 'success';
    case 'BUSY_LIMITED': return 'warning';
    case 'NOT_TAKING_WORK': return 'error';
    default: return 'secondary';
  }
};

const getHoursAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  return diffHours;
};

const normalizePhoneNumber = (phone: string) => {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
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
      ) : !provider ? (
        <div>Provider not found</div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8 text-center">Provider Profile</h1>

          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <h1 className="text-3xl font-bold mb-4">{provider.name}</h1>
                <p className="text-gray-600 mb-2">{getIslandDisplayName(provider.island)}</p>
                <Badge label={provider.status} variant={getAvailabilityColor(provider.status)} className="mb-4" />
                {provider.is_premium_active && (
                  <Badge label={provider.is_trial ? "Trial" : "Premium"} variant="success" className="mb-4 ml-2" />
                )}
                <p className="text-sm text-gray-500 mb-4">
                  Profile activity: {provider.last_active_at ? `${getHoursAgo(provider.last_active_at)} hours ago` : 'Never'}
                </p>

            {provider.preferred_contact_method && (
              <p className="text-sm text-gray-600 mb-4">
                Preferred contact: {provider.preferred_contact_method}
              </p>
            )}
            <Button onClick={handleReport} variant="secondary" className="mb-4">Report this listing</Button>

            {provider.typical_hours && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Hours</h2>
                <p>{provider.typical_hours}</p>
                {provider.emergency_calls_accepted && (
                  <Badge label="Emergency Calls Accepted" variant="warning" className="mt-2" />
                )}
              </div>
            )}

            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Service Areas</h2>
              <div className="flex flex-wrap gap-2">
                {provider.areas.map(area => (
                  <Badge key={area.id} label={area.name} variant="secondary" />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <DisclaimerNotice variant="full" className="mb-3" />
              <div className="flex flex-wrap gap-2">
                {provider.contact_call_enabled && (
                  <Button href={`tel:${provider.phone}`}>📞 Call</Button>
                )}
                {provider.contact_whatsapp_enabled && provider.whatsapp && (
                  <Button href={`https://wa.me/${normalizePhoneNumber(provider.whatsapp)}`} variant="secondary">
                    💬 WhatsApp
                  </Button>
                )}
                {provider.contact_sms_enabled && (
                  <Button href={`sms:${normalizePhoneNumber(provider.phone)}`} variant="secondary">
                    💬 SMS
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
        </>
      )}
    </div>
  );
};