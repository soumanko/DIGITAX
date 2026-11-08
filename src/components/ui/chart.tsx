'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartProps {
  config?: Record<string, { label: string; color: string }>;
  className?: string;
  children?: React.ReactNode;
}

export function ChartContainer({
  config,
  className,
  children,
}: ChartProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface shadow-sm', className)}>
      {children}
    </div>
  );
}

export function ChartTooltip({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('z-20 rounded-md bg-surface px-3 py-2 shadow-sm border border-border', className)}>
      {children}
    </div>
  );
}

export function ChartTooltipContent({
  className,
  ...props
}: {
  className?: string;
} & Record<string, unknown>) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props} />
  );
}

export function ChartTooltipLabel({
  className,
  ...props
}: {
  className?: string;
} & Record<string, unknown>) {
  return (
    <span className={cn('text-xs font-semibold text-text-secondary', className)} {...props} />
  );
}

export function ChartList({
  className,
  ...props
}: {
  className?: string;
} & Record<string, unknown>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props} />
  );
}

export function ChartListItem({
  className,
  ...props
}: {
  className?: string;
} & Record<string, unknown>) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props} />
  );
}