import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = 'http://localhost:3000';

interface Area {
  island: string;
  neighborhood: string;
}

export const Join: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    island: '',
    categories: [] as string[],
    areas: [] as Area[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.phone) newErrors.phone = 'Phone is required';
    if (!form.island) newErrors.island = 'Island is required';
    if (form.categories.length === 0) newErrors.categories = 'At least one category required';
    if (form.areas.length === 0) newErrors.areas = 'At least one area required';
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

  const handleAreaChange = (area: Area, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      areas: checked
        ? [...prev.areas, area]
        : prev.areas.filter(a => a.island !== area.island || a.neighborhood !== area.neighborhood),
    }));
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
              <option value="St. Thomas">St. Thomas</option>
              <option value="St. John">St. John</option>
              <option value="St. Croix">St. Croix</option>
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
            <label className="block text-sm font-medium mb-1">Areas</label>
            {[
              { island: 'St. Thomas', neighborhood: 'Charlotte Amalie' },
              { island: 'St. John', neighborhood: 'Cruz Bay' },
            ].map(area => (
              <label key={`${area.island}-${area.neighborhood}`} className="block">
                <input
                  type="checkbox"
                  checked={form.areas.some(a => a.island === area.island && a.neighborhood === area.neighborhood)}
                  onChange={(e) => handleAreaChange(area, e.target.checked)}
                /> {area.island} - {area.neighborhood}
              </label>
            ))}
            {errors.areas && <p className="text-red-500 text-sm">{errors.areas}</p>}
          </div>
          <Button type="submit">Join</Button>
        </form>
      </Card>
    </div>
  );
};