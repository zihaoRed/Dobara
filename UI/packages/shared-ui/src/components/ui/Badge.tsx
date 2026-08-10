import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-dobara-success-light text-[#064e3b]',
  warning: 'bg-dobara-warning-light text-[#78350f]',
  error: 'bg-dobara-error-light text-[#7f1d1d]',
  info: 'bg-dobara-info-light text-[#1e3a8a]',
  accent: 'bg-accent-50 text-accent-800',
  neutral: 'bg-surface-high text-text-secondary',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-eyebrow rounded-sm',
  md: 'px-3 py-1 text-caption rounded-md',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  className = '',
  children,
}) => {
  return (
    <span className={`inline-flex items-center font-semibold ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};
