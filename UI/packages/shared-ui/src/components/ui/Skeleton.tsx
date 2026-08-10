import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
  return (
    <div
      className={`animate-pulse bg-surface-high rounded-md ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-surface-container rounded-lg p-4 space-y-3">
    <Skeleton height="160px" className="w-full" />
    <Skeleton height="20px" className="w-3/4" />
    <Skeleton height="16px" className="w-1/2" />
    <div className="flex justify-between">
      <Skeleton height="24px" width="80px" />
      <Skeleton height="24px" width="60px" />
    </div>
  </div>
);
