import React, { useState } from 'react';
import { Provider } from '../../services/providerApi';
import { Card } from '../Card';
import { Button } from '../Button';

interface AccountManagementProps {
  provider: Provider;
  onDeleteAccount?: () => void;
  onUpgradePlan?: () => void;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({
  provider,
  onDeleteAccount,
  onUpgradePlan
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Compute plan-related values
  const plan = provider.plan?.toUpperCase();
  const planSource = provider.plan_source?.toUpperCase();

  const isPremium =
    (provider as any).is_premium_active ?? (plan === "PREMIUM");

  const isTrial =
    (provider as any).is_trial ?? (planSource === "TRIAL");

  const planLabel = isPremium ? (isTrial ? "Premium (Trial)" : "Premium Plan") : "Free Plan";

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
      onDeleteAccount?.();
    }
    setShowDeleteConfirm(false);
  };

  return (
    <Card className="space-y-6">
      <h3 className="text-lg font-semibold">Account Management</h3>

      {/* Plan Management */}
      <div>
        <h4 className="text-md font-medium mb-3">Plan Management</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">{planLabel}</p>
              <p className="text-sm text-gray-600">
                {isPremium
                  ? 'You have access to all premium features'
                  : 'Upgrade to access premium features like higher visibility and emergency services'
                }
              </p>
            </div>
            {!isPremium && (
              <Button onClick={onUpgradePlan} variant="primary" size="sm">
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h4 className="text-md font-medium mb-3">Account Actions</h4>
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h5 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h5>
            <p className="text-xs text-red-700 mb-3">
              Deleting your account will permanently remove all your data, including your profile,
              contact history, and any premium features. This action cannot be undone.
            </p>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="secondary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Identity Change Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-amber-900 mb-2">Identity Changes Require Approval</h4>
        <p className="text-xs text-amber-700 mb-2">
          Changes to your business name, primary location, or core business identity require admin approval.
        </p>
        <p className="text-xs text-amber-700">
          <strong>Why?</strong> This protects your established reputation and ensures customer trust.
          Contact support if you need to make these changes.
        </p>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Account Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};