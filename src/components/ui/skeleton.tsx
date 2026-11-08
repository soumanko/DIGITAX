import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'pulse';
  width?: string;
  height?: string;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const baseClasses = 'animate-pulse rounded-md bg-surface-tertiary dark:bg-surface-tertiary';

  if (variant === 'circle') {
    return (
      <div
        className={cn(baseClasses, 'w-10 h-10 rounded-full', className)}
        style={{ width, height }}
      />
    );
  }

  if (variant === 'rect') {
    return (
      <div className={cn(baseClasses, className)} style={{ width, height }} />
    );
  }

  // Default text skeleton lines
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="h-4 bg-surface-tertiary dark:bg-surface-tertiary rounded animate-pulse w-full" />
      <div className="h-4 bg-surface-tertiary dark:bg-surface-tertiary rounded animate-pulse w-3/4" />
    </div>
  );
}
