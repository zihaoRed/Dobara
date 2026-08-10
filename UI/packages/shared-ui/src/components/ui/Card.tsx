import React from 'react';

interface CardProps {
  variant?: 'default' | 'hover' | 'flat';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-surface-container shadow-card',
  hover: 'bg-surface-container shadow-card hover:shadow-card-hover cursor-pointer transition-shadow',
  flat: 'bg-surface-low',
};

export const Card: React.FC<CardProps> = ({ variant = 'default', className = '', children, onClick }) => {
  return (
    <div
      className={`rounded-lg p-4 ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <div className={`mb-3 ${className}`}>{children}</div>;

export const CardContent: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <div className={className}>{children}</div>;
