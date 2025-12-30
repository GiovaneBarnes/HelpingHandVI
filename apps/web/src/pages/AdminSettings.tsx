import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { AdminLayout } from '../components/AdminLayout';
import { API_BASE } from '../constants';
import { User } from 'firebase/auth';
import { useAdminAuth } from '../hooks/useAdminAuth';

export const AdminSettings: React.FC = () => {
  const [emergencyMode, setEmergencyMode] = useState({ enabled: false });
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    checks: Record<string, { status: string; details: unknown }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAdminAuth();

  // Helper function for admin API calls with Firebase auth
  const adminFetch = async (user: User, url: string, options: RequestInit = {}) => {
    const token = await user.getIdToken();

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchEmergencyMode();
    fetchSystemHealth();
  }, [user, authLoading]);

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
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error('Failed to fetch health status');
      const data = await response.json();
      setSystemHealth(data);
    } catch (err) {
      console.error('Error fetching system health:', err);
      setSystemHealth({
        status: 'unhealthy',
        checks: {
          api: { status: 'unhealthy', details: { error: 'Failed to connect to health endpoint' } }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyModeToggle = async () => {
    if (!user) return;
    const notes = prompt('Notes for this change:');
    if (notes !== null) {
      try {
        const response = await adminFetch(user, `${API_BASE}/admin/settings/emergency-mode`, {
          method: 'PATCH',
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

  if (authLoading) {
    return (
      <AdminLayout title="Settings">
        <div className="p-6">Loading...</div>
      </AdminLayout>
    );
  }

  if (loading || !systemHealth) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-4xl">
        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${emergencyMode.enabled ? 'bg-red-100' : 'bg-green-100'}`}>
                <span className="text-2xl">{emergencyMode.enabled ? '🚨' : '✅'}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emergency Mode</p>
                <p className={`text-lg font-bold ${emergencyMode.enabled ? 'text-red-600' : 'text-green-600'}`}>
                  {emergencyMode.enabled ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                systemHealth?.status === 'healthy' ? 'bg-green-100' :
                systemHealth?.status === 'unhealthy' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <span className="text-2xl">
                  {systemHealth?.status === 'healthy' ? '✅' :
                   systemHealth?.status === 'unhealthy' ? '❌' : '⚠️'}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className={`text-lg font-bold ${
                  systemHealth?.status === 'healthy' ? 'text-green-600' :
                  systemHealth?.status === 'unhealthy' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
                </p>
              </div>
            </div>
            {systemHealth && systemHealth.checks && (
              <div className="mt-4 space-y-2">
                {Object.entries(systemHealth.checks).map(([checkName, check]) => (
                  <div key={checkName} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600">{checkName.replace('_', ' ')}:</span>
                    <span className={`font-medium ${
                      check.status === 'healthy' ? 'text-green-600' :
                      check.status === 'unhealthy' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {check.status === 'healthy' ? '✅' :
                       check.status === 'unhealthy' ? '❌' : '⚠️'} {check.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {systemHealth?.status === 'unhealthy' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400 text-lg">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">System Issues Detected</h4>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Check the individual system components above for details on what's failing.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Mode Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Emergency Mode Control</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage system-wide emergency response settings
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-medium text-gray-900">Emergency Response Mode</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    When enabled, EMERGENCY_READY providers are boosted in rankings and a banner appears on the homepage to highlight emergency services.
                  </p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  emergencyMode.enabled
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {emergencyMode.enabled ? '🔔 ACTIVE' : '✅ INACTIVE'}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleEmergencyModeToggle}
                  variant={emergencyMode.enabled ? 'secondary' : 'primary'}
                  size="lg"
                >
                  {emergencyMode.enabled ? '🔕 Disable Emergency Mode' : '🚨 Enable Emergency Mode'}
                </Button>
              </div>
            </div>

            {emergencyMode.enabled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">Emergency Mode is Active</h4>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Emergency response protocols are currently enabled. Providers with EMERGENCY_READY badges are prioritized in search results, and users will see an emergency services banner on the homepage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!emergencyMode.enabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-green-400 text-xl">✅</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">Normal Operations</h4>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        The system is operating under normal conditions. All providers are displayed according to standard ranking criteria.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Settings Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Settings</h3>
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">⚙️</div>
            <h4 className="text-base font-medium text-gray-900 mb-2">More Settings Coming Soon</h4>
            <p className="text-gray-600">
              Future settings like notification preferences, data retention policies, and system maintenance options will be available here.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};