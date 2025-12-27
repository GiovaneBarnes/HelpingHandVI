import React from 'react';

interface DisclaimerNoticeProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const DisclaimerNotice: React.FC<DisclaimerNoticeProps> = ({
  variant = 'full',
  className = ''
}) => {
  const isCompact = variant === 'compact';

  return (
    <div className={`border border-blue-200 rounded-lg bg-blue-50 p-3 ${isCompact ? 'text-sm' : 'text-base'} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className={`ml-3 ${isCompact ? 'space-y-1' : 'space-y-2'}`}>
          {!isCompact && (
            <h4 className="text-sm font-medium text-blue-800">Before you contact</h4>
          )}
          <div className={`text-blue-700 ${isCompact ? 'space-y-1' : 'space-y-2'}`}>
            <p>We don't guarantee work, pricing, timing, or quality.</p>
            <p>Confirm details directly with the provider.</p>
          </div>
        </div>
      </div>
    </div>
  );
};