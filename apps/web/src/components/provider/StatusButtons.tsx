import React from 'react';
import { Provider } from '../../services/providerApi';

interface StatusButtonsProps {
  currentStatus: Provider['status'];
  onStatusChange: (status: Provider['status']) => void;
}

export const StatusButtons: React.FC<StatusButtonsProps> = ({ currentStatus, onStatusChange }) => {
  return (
    <div className="flex space-x-4">
      <button
        onClick={() => onStatusChange('OPEN_NOW')}
        className={`px-4 py-2 rounded ${currentStatus === 'OPEN_NOW' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
      >
        Open for Work
      </button>
      <button
        onClick={() => onStatusChange('BUSY_LIMITED')}
        className={`px-4 py-2 rounded ${currentStatus === 'BUSY_LIMITED' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
      >
        Busy / Limited
      </button>
      <button
        onClick={() => onStatusChange('NOT_TAKING_WORK')}
        className={`px-4 py-2 rounded ${currentStatus === 'NOT_TAKING_WORK' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
      >
        Not Taking Work
      </button>
    </div>
  );
};