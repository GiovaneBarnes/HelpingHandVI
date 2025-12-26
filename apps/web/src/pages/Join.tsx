import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = 'http://localhost:3000';

interface Area {
  id: number;
  name: string;
  island: string;
}

export const Join: React.FC = () => {
  const navigate = useNavigate();
  const [availableAreas, setAvailableAreas] = useState<Area[]>([]);
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (form.island) {
      fetchAreas();
    }
  }, [form.island]);

  const fetchAreas = async () => {
    try {
      const response = await fetch(`${API_BASE}/areas?island=${form.island}`);
      if (response.ok) {
        const areas = await response.json();
        setAvailableAreas(areas);
      }
    } catch (err) {
      console.error('Failed to fetch areas');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.phone) newErrors.phone = 'Phone is required';
    if (!form.island) newErrors.island = 'Island is required';
    if (form.categories.length === 0) newErrors.categories = 'At least one category required';
    if (form.areas.length === 0) newErrors.areas = 'At least one area required';
    if (!form.contact_call_enabled && !form.contact_whatsapp_enabled && !form.contact_sms_enabled) {
      newErrors.contact_methods = 'At least one contact method must be enabled';
    }
    const enabledMethods = [];
    if (form.contact_call_enabled) enabledMethods.push('CALL');
    if (form.contact_whatsapp_enabled) enabledMethods.push('WHATSAPP');
    if (form.contact_sms_enabled) enabledMethods.push('SMS');
    if (form.preferred_contact_method && !enabledMethods.includes(form.preferred_contact_method)) {
      newErrors.preferred_contact_method = 'Preferred method must be enabled';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const response = await fetch(`${API_BASE}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Failed to create provider');
      const data = await response.json();
      navigate(`/dashboard/${data.id}?token=placeholder`);
    } catch (err) {
      alert('Error creating provider');
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category),
    }));
  };

  const handleAreaChange = (areaId: number, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      areas: checked
        ? [...prev.areas, areaId]
        : prev.areas.filter(id => id !== areaId),
    }));
  };

  const handleContactMethodChange = (method: string, enabled: boolean) => {
    setForm(prev => {
      const newForm = { ...prev, [`contact_${method.toLowerCase()}_enabled`]: enabled };
      // Clear preferred method if it's disabled
      if (!enabled && prev.preferred_contact_method === method) {
        newForm.preferred_contact_method = '';
      }
      return newForm;
    });
  };

  const getEnabledMethods = () => {
    const methods = [];
    if (form.contact_call_enabled) methods.push('CALL');
    if (form.contact_whatsapp_enabled) methods.push('WHATSAPP');
    if (form.contact_sms_enabled) methods.push('SMS');
    return methods;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Join as Provider</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">WhatsApp (optional)</label>
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
              <option value="">Select Island</option>
              <option value="STT">St. Thomas</option>
              <option value="STJ">St. John</option>
              <option value="STX">St. Croix</option>
            </select>
            {errors.island && <p className="text-red-500 text-sm">{errors.island}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Categories</label>
            {['Electrician', 'Plumber', 'AC Technician'].map(cat => (
              <label key={cat} className="block">
                <input
                  type="checkbox"
                  checked={form.categories.includes(cat)}
                  onChange={(e) => handleCategoryChange(cat, e.target.checked)}
                /> {cat}
              </label>
            ))}
            {errors.categories && <p className="text-red-500 text-sm">{errors.categories}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Service Areas</label>
            {availableAreas.map(area => (
              <label key={area.id} className="block">
                <input
                  type="checkbox"
                  checked={form.areas.includes(area.id)}
                  onChange={(e) => handleAreaChange(area.id, e.target.checked)}
                /> {area.name}
              </label>
            ))}
            {errors.areas && <p className="text-red-500 text-sm">{errors.areas}</p>}
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Contact Preferences</h3>
            <div className="space-y-2">
              <label className="block">
                <input
                  type="checkbox"
                  checked={form.contact_call_enabled}
                  onChange={(e) => handleContactMethodChange('call', e.target.checked)}
                /> Enable Call button
              </label>
              <label className="block">
                <input
                  type="checkbox"
                  checked={form.contact_whatsapp_enabled}
                  onChange={(e) => handleContactMethodChange('whatsapp', e.target.checked)}
                /> Enable WhatsApp button
              </label>
              <label className="block">
                <input
                  type="checkbox"
                  checked={form.contact_sms_enabled}
                  onChange={(e) => handleContactMethodChange('sms', e.target.checked)}
                /> Enable SMS button
              </label>
              {errors.contact_methods && <p className="text-red-500 text-sm">{errors.contact_methods}</p>}
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Preferred Contact Method</label>
              <select
                value={form.preferred_contact_method}
                onChange={(e) => setForm(prev => ({ ...prev, preferred_contact_method: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">None</option>
                {getEnabledMethods().map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              {errors.preferred_contact_method && <p className="text-red-500 text-sm">{errors.preferred_contact_method}</p>}
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

          <Button type="submit">Join</Button>
        </form>
      </Card>
    </div>
  );
};