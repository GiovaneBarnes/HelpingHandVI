import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { providerApi, Provider, Insights } from '../../services/providerApi';
import { StatusButtons } from '../../components/provider/StatusButtons';
import { LivePreviewCard } from '../../components/provider/LivePreviewCard';
import { ProfileForm } from '../../components/provider/ProfileForm';
import { ProviderCapabilities } from '../../components/provider/ProviderCapabilities';
import { AccountManagement } from '../../components/provider/AccountManagement';

const ProviderDashboard: React.FC = () => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    setupHeartbeat();
  }, []);

  const loadData = async () => {
    try {
      const [providerData, insightsData] = await Promise.all([
        providerApi.getMe(),
        providerApi.getInsights('7d'),
      ]);
      setProvider(providerData);
      setInsights(insightsData);
      
      // Log login activity for verification tracking
      if (providerData) {
        await providerApi.logLogin();
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const setupHeartbeat = () => {
    let timer: NodeJS.Timeout;
    let startTime = Date.now();

    const sendHeartbeat = async () => {
      if (document.visibilityState === 'visible' && Date.now() - startTime >= 8000) {
        try {
          await providerApi.heartbeat();
        } catch (err) {
          console.error('Heartbeat failed');
        }
      }
    };

    const resetTimer = () => {
      if (document.visibilityState === 'visible') {
        startTime = Date.now();
        timer = setTimeout(sendHeartbeat, 8000);
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      } else {
        clearTimeout(timer);
      }
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', resetTimer);
    };
  };

  const handleStatusUpdate = async (status: Provider['status']) => {
    if (!provider) return;
    try {
      const updated = await providerApi.updateStatus(status);
      setProvider(updated);
      await providerApi.heartbeat(); // Send heartbeat on status change
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleProfileSave = async (profile: Partial<Pick<Provider, 'phone' | 'description' | 'categories' | 'areas'>>) => {
    if (!provider) return;
    const updated = await providerApi.updateProfile(profile);
    setProvider(updated);
    await providerApi.heartbeat(); // Send heartbeat on profile save
  };

  const handleRequestChange = async (field: 'name' | 'island', newValue: string, reason: string) => {
    if (!provider) return;
    try {
      // In a real implementation, this would call an API endpoint to create a change request
      alert(`Change request submitted for ${field}: "${newValue}"\nReason: ${reason}\n\nThis would be sent to admin for approval.`);
    } catch (err) {
      throw new Error('Failed to submit change request');
    }
  };

  const handleDeleteAccount = async () => {
    if (!provider) return;
    try {
      // In a real implementation, this would call an API endpoint
      alert('Account deletion is not implemented in the demo. Please contact support.');
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const handleUpgradePlan = async () => {
    if (!provider) return;
    try {
      // In a real implementation, this would redirect to payment or upgrade flow
      alert('Plan upgrade is not implemented in the demo. Please contact support.');
    } catch (err) {
      setError('Failed to upgrade plan');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('provider_token');
    window.location.href = '/provider/login';
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!provider) return <div>No provider data</div>;

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
              <button
                onClick={handleLogout}
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Status & Visibility */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status & Visibility</h2>
          <StatusButtons currentStatus={provider.status} onStatusChange={handleStatusUpdate} />
          <p className="mt-2 text-sm text-gray-600">Last updated: {new Date(provider.updated_at).toLocaleString()}</p>
        </div>

        {/* Live Preview */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How You Appear to Customers</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left side: Search results preview */}
            <div className="flex flex-col">
              <h3 className="text-lg font-medium mb-3">Search Results</h3>
              <p className="text-sm text-gray-600 mb-4">
                This is how your profile appears when customers browse for providers:
              </p>
              <div className="flex-1 flex items-start">
                <div className="w-full max-w-md">
                  <LivePreviewCard provider={provider} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How You Appear</h2>
          <ProfileForm
            provider={provider}
            onSave={handleProfileSave}
            onRequestChange={handleRequestChange}
          />
        </div>

        {/* Provider Capabilities */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Capabilities & Trust Level</h2>
          <ProviderCapabilities provider={provider} />
        </div>

        {/* Account Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <AccountManagement
            provider={provider}
            onDeleteAccount={handleDeleteAccount}
            onUpgradePlan={handleUpgradePlan}
          />
        </div>

        {/* Insights */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Insights (Last 7 Days)</h2>
          {insights && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{insights.calls}</p>
                <p className="text-sm text-gray-600">Calls</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{insights.sms}</p>
                <p className="text-sm text-gray-600">SMS</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;