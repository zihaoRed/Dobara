import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-text-muted mb-4">
        {icon || <PackageOpen size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="text-h4 font-heading text-text-secondary mb-2">{title}</h3>
      {description && <p className="text-body text-text-muted mb-4 max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
