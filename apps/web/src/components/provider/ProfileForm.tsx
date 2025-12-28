import React, { useState, useEffect } from 'react';
import { Provider } from '../../services/providerApi';

interface Category {
  id: number;
  name: string;
}

interface ProfileFormProps {
  provider: Provider;
  onSave: (profile: Partial<Pick<Provider, 'phone' | 'description' | 'categories' | 'areas'>>) => Promise<void>;
  onRequestChange?: (field: 'name' | 'island', newValue: string, reason: string) => Promise<void>;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ provider, onSave, onRequestChange }) => {
  const [phone, setPhone] = useState(provider.phone);
  const [description, setDescription] = useState(provider.description);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(provider.categories.map(c => c.id));
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestField, setRequestField] = useState<'name' | 'island'>('name');
  const [requestValue, setRequestValue] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requesting, setRequesting] = useState(false);

  const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/categories`);
        if (response.ok) {
          const categories = await response.json();
          setAvailableCategories(categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      // Create categories array from selected IDs and available categories
      const categories = availableCategories
        .filter(cat => selectedCategories.includes(cat.id))
        .map(cat => ({ id: cat.id, name: cat.name }));
      await onSave({ phone, description, categories });
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestChange = async () => {
    if (!requestValue.trim() || !requestReason.trim()) {
      setMessage('Please fill in all fields');
      return;
    }

    setRequesting(true);
    try {
      await onRequestChange?.(requestField, requestValue, requestReason);
      setMessage('Change request submitted successfully');
      setShowRequestModal(false);
      setRequestValue('');
      setRequestReason('');
    } catch (err) {
      setMessage('Failed to submit change request');
    } finally {
      setRequesting(false);
    }
  };

  const openRequestModal = (field: 'name' | 'island') => {
    setRequestField(field);
    setRequestValue(field === 'name' ? provider.name : provider.island);
    setRequestReason('');
    setShowRequestModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Identity Protection Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-amber-900 mb-2">Protected Identity Information</h4>
        <p className="text-xs text-amber-700 mb-3">
          Your business name (<strong>{provider.name}</strong>) and location (<strong>{provider.island}</strong>)
          are protected and require admin approval to change.
        </p>
        <p className="text-xs text-amber-700 mb-3">
          This ensures trust and prevents identity confusion.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => openRequestModal('name')}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded"
          >
            Request Name Change
          </button>
          <button
            onClick={() => openRequestModal('island')}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded"
          >
            Request Location Change
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
        <p className="text-sm text-gray-500">{description.length}/200 characters</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
        <p className="text-xs text-gray-600 mb-3">Select the categories that best describe your services</p>
        <div className="grid grid-cols-2 gap-2">
          {availableCategories.map(category => (
            <label key={category.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, category.id]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{category.name}</span>
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
      {message && <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

      {/* Request Change Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4 w-full">
            <h3 className="text-lg font-semibold mb-4">
              Request {requestField === 'name' ? 'Business Name' : 'Location'} Change
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current {requestField === 'name' ? 'Name' : 'Location'}
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {requestField === 'name' ? provider.name : provider.island}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested {requestField === 'name' ? 'Name' : 'Location'}
                </label>
                {requestField === 'island' ? (
                  <select
                    value={requestValue}
                    onChange={(e) => setRequestValue(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select an island</option>
                    <option value="STT">St. Thomas (STT)</option>
                    <option value="STJ">St. John (STJ)</option>
                    <option value="STX">St. Croix (STX)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={requestValue}
                    onChange={(e) => setRequestValue(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2"
                    placeholder={`Enter new ${requestField === 'name' ? 'business name' : 'location'}`}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Change
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Please explain why you need this change..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChange}
                disabled={requesting || !requestValue.trim() || !requestReason.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {requesting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};