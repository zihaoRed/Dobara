import React from 'react';
import { IndianRupee } from 'lucide-react';

interface PriceDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTax?: boolean;
  strikethrough?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-body font-semibold',
  md: 'text-h4 font-bold',
  lg: 'text-h3 font-bold',
  xl: 'text-display font-bold',
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  size = 'md',
  showTax = false,
  strikethrough = false,
  className = '',
}) => {
  const formatted = new Intl.NumberFormat('en-IN').format(amount);

  return (
    <span className={`inline-flex items-baseline gap-1 ${sizeClasses[size]} ${strikethrough ? 'line-through text-text-muted' : 'text-text-primary'} ${className}`}>
      <IndianRupee size={size === 'xl' ? 36 : size === 'lg' ? 24 : size === 'md' ? 20 : 16} />
      {formatted}
      {showTax && <span className="text-caption text-text-muted font-normal ml-1">incl. tax</span>}
    </span>
  );
};
