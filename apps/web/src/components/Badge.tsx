import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'secondary';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', className = '' }) => {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {label}
    </span>
  );
};