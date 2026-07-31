import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'success' | 'warning' | 'error' | 'primary';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorClasses = {
  success: 'bg-dobara-success',
  warning: 'bg-dobara-warning',
  error: 'bg-dobara-error',
  primary: 'bg-primary-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  className = '',
}) => {
  const pct = Math.min(Math.max(0, value), max);
  const percent = Math.round((pct / max) * 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 rounded-full bg-surface-high overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-caption font-semibold text-text-secondary w-10 text-right">
          {percent}%
        </span>
      )}
    </div>
  );
};
