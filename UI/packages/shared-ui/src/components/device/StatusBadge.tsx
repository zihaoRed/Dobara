import React from 'react';

type StatusKey = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'confirmed' | 'shipped' | 'returned';

interface StatusConfig {
  label: string;
  color: string;
}

const statusConfigs: Record<StatusKey, StatusConfig> = {
  pending: { label: 'Pending', color: 'bg-dobara-warning-light text-[#78350f]' },
  in_progress: { label: 'In Progress', color: 'bg-dobara-info-light text-[#1e3a8a]' },
  completed: { label: 'Completed', color: 'bg-dobara-success-light text-[#064e3b]' },
  cancelled: { label: 'Cancelled', color: 'bg-surface-high text-text-muted' },
  rejected: { label: 'Rejected', color: 'bg-dobara-error-light text-[#7f1d1d]' },
  confirmed: { label: 'Confirmed', color: 'bg-dobara-success-light text-[#064e3b]' },
  shipped: { label: 'Shipped', color: 'bg-primary-50 text-primary-700' },
  returned: { label: 'Returned', color: 'bg-accent-50 text-accent-800' },
};

interface StatusBadgeProps {
  status: StatusKey;
  className?: string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', customLabel }) => {
  const config = statusConfigs[status] || statusConfigs.pending;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-eyebrow font-semibold ${config.color} ${className}`}>
      {customLabel || config.label}
    </span>
  );
};
