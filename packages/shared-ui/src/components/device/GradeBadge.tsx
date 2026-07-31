import React from 'react';

interface GradeBadgeProps {
  grade: 'A' | 'B' | 'C' | 'D';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const gradeConfig = {
  A: { label: 'Like New', color: 'text-dobara-success bg-dobara-success-light' },
  B: { label: 'Excellent', color: 'text-primary-700 bg-primary-50' },
  C: { label: 'Good', color: 'text-dobara-warning bg-dobara-warning-light' },
  D: { label: 'Fair', color: 'text-dobara-error bg-dobara-error-light' },
};

export const GradeBadge: React.FC<GradeBadgeProps> = ({ grade, showLabel = true, size = 'sm' }) => {
  const config = gradeConfig[grade];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-eyebrow' : 'px-3 py-1 text-caption';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-semibold ${config.color} ${sizeClass}`}>
      <span className="font-bold">{grade}</span>
      {showLabel && <span className="opacity-80">· {config.label}</span>}
    </span>
  );
};
