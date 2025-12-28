import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

interface Category {
  id: number;
  name: string;
}

interface ProviderResponse {
  id: number;
  plan: string;
  plan_source: string;
  trial_end_at: string;
  trial_days_left: number;
}

export const Join: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    island: '',
    categories: [] as string[],
    emergency_calls_accepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(response => response.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {
        // Fallback to hardcoded categories if API fails
        setCategories([
          { id: 1, name: 'Electrician' },
          { id: 2, name: 'Plumber' },
          { id: 3, name: 'AC Technician' }
        ]);
      });
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email address';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!form.phone) newErrors.phone = 'Phone is required';
    if (!form.island) newErrors.island = 'Island is required';
    if (form.categories.length === 0) newErrors.categories = 'At least one category required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    fetch(`${API_BASE}/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        island: form.island,
        categories: form.categories,
        emergency_calls_accepted: form.emergency_calls_accepted,
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to create provider');
        return response.json() as Promise<ProviderResponse>;
      })
      .then(data => {
        navigate(`/dashboard/${data.id}?token=placeholder`);
      })
      .catch(() => {
        alert('Error creating provider');
      });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-indigo-600 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-white text-xl font-bold hover:text-indigo-100">
                HelpingHandVI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/provider/login"
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Provider Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Join as Provider</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            <p className="text-sm text-gray-600 mt-1">
              Choose a professional name that customers will recognize and trust.
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            <p className="text-sm text-gray-600 mt-1">
              We'll use this for account notifications and password recovery.
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            <p className="text-sm text-gray-600 mt-1">
              Must be at least 8 characters long.
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="island">
              Island <span className="text-red-500">*</span>
            </label>
            <select
              id="island"
              value={form.island}
              onChange={(e) => setForm(prev => ({ ...prev, island: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select your island</option>
              <option value="STT">St. Thomas</option>
              <option value="STX">St. Croix</option>
              <option value="STJ">St. John</option>
            </select>
            {errors.island && <p className="text-red-500 text-sm">{errors.island}</p>}
            <p className="text-sm text-gray-600 mt-1">
              Choose your island carefully - this determines which customers can find you.
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-3">
              Categories <span className="text-red-500">*</span>
            </label>
            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map(cat => (
                  <label
                    key={cat.id}
                    className="flex items-center space-x-3 cursor-pointer"
                    htmlFor={`category-${cat.id}`}
                  >
                    <input
                      id={`category-${cat.id}`}
                      type="checkbox"
                      checked={form.categories.includes(cat.name)}
                      onChange={(e) => handleCategoryChange(cat.name, e.target.checked)}
                      className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-900">{cat.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Loading categories...</p>
            )}
            {errors.categories && <p className="text-red-500 text-sm">{errors.categories}</p>}
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Work Information</h3>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.emergency_calls_accepted}
                onChange={(e) => setForm(prev => ({ ...prev, emergency_calls_accepted: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Accept emergency calls</span>
                <p className="text-sm text-gray-600 mt-1">
                  Check this if you're available for urgent repairs and emergencies. This helps customers find you when they need immediate help.
                </p>
              </div>
            </label>
          </div>

          <Button type="submit">Join</Button>
        </form>
      </Card>
    </div>
    </div>
  );
};