import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const getShapeClass = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'rounded h-4 w-3/4';
      default:
        return 'rounded-lg';
    }
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-zinc-800 ${getShapeClass()} ${className}`}
      aria-hidden="true"
    />
  );
};

export const ProjectSkeleton: React.FC = () => {
  return (
    <div className="border border-custom-border p-4 rounded-lg bg-secondary-bg">
      <Skeleton className="w-full aspect-[3/2] mb-4" />
      <Skeleton variant="text" className="w-1/2 mb-2" />
      <Skeleton variant="text" className="w-3/4 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded" />
        <Skeleton className="w-16 h-6 rounded" />
      </div>
    </div>
  );
};
