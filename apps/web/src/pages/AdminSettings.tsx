import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;
const ADMIN_KEY = 'admin-secret'; // In real app, from env

export const AdminSettings: React.FC = () => {
  const [emergencyMode, setEmergencyMode] = useState({ enabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      window.location.href = '/admin/login';
      return;
    }
    fetchEmergencyMode();
  }, []);

  const fetchEmergencyMode = async () => {
    try {
      const response = await fetch(`${API_BASE}/settings/emergency-mode`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setEmergencyMode(data.data || { enabled: false });
    } catch (err) {
      console.error('Error fetching emergency mode status');
      alert('Error fetching emergency mode status');
      setEmergencyMode({ enabled: false });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyModeToggle = async () => {
    const notes = prompt('Notes for this change:');
    if (notes !== null) {
      try {
        const response = await fetch(`${API_BASE}/admin/settings/emergency-mode`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': ADMIN_KEY },
          body: JSON.stringify({ enabled: !emergencyMode.enabled, notes }),
        });
        if (!response.ok) throw new Error('Failed to update');
        const data = await response.json();
        setEmergencyMode(data.data || { enabled: !emergencyMode.enabled });
      } catch (err) {
        alert('Error updating emergency mode');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin - Settings</h1>
      
      <div className="mb-8">
        <nav className="flex space-x-4">
          <a href="/admin/providers" className="text-blue-600 hover:underline">Providers</a>
          <a href="/admin/reports" className="text-blue-600 hover:underline">Reports</a>
          <a href="/admin/settings" className="text-blue-600 hover:underline">Settings</a>
        </nav>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Emergency Mode</h2>
        <p className="text-gray-600 mb-4">
          When enabled, EMERGENCY_READY providers are boosted in rankings and a banner appears on the homepage.
        </p>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emergency-mode"
              checked={emergencyMode.enabled}
              onChange={() => {}} // Handled by button
              className="mr-2"
            />
            <label htmlFor="emergency-mode" className="text-lg">
              Emergency Mode: {emergencyMode.enabled ? 'ENABLED' : 'DISABLED'}
            </label>
          </div>

          <Button onClick={handleEmergencyModeToggle} variant={emergencyMode.enabled ? 'secondary' : 'primary'}>
            {emergencyMode.enabled ? 'Disable' : 'Enable'} Emergency Mode
          </Button>
        </div>

        {emergencyMode.enabled && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              <strong>Active:</strong> Emergency mode is currently enabled. Providers with EMERGENCY_READY badges are prioritized in search results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};