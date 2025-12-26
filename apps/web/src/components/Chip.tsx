import React from 'react';

interface ChipProps {
  label: string;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ label, className = '' }) => {
  return (
    <span className={`inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm ${className}`}>
      {label}
    </span>
  );
};