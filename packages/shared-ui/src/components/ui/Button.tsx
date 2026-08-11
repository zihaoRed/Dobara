import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  pill?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50',
  secondary:
    'bg-surface-container text-text-secondary hover:bg-surface-high active:bg-surface-container border border-border',
  accent:
    'bg-accent-500 text-white hover:opacity-90 active:opacity-80 disabled:opacity-50',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-container active:bg-surface-high',
  danger: 'bg-dobara-error text-white hover:opacity-90 active:opacity-80',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-[32px] px-3 text-caption gap-1',
  md: 'h-[40px] px-4 text-body gap-2',
  lg: 'h-[48px] px-6 text-lead gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  pill = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const radius = pill ? 'rounded-full' : size === 'lg' ? 'rounded-lg' : 'rounded-md';
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${radius} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
