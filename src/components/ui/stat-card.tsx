import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantClasses = {
    default: 'bg-surface border border-border',
    accent: 'bg-surface border border-border',
    success: 'bg-surface border border-border',
    warning: 'bg-surface border border-border',
    error: 'bg-surface border border-border',
  };

  const trendIcon = trend?.direction === 'up' ? (
    <span className="text-success-600 dark:text-success-400">▲ {trend.value}</span>
  ) : trend?.direction === 'down' ? (
    <span className="text-error-600 dark:text-error-400">▼ {trend.value}</span>
  ) : trend?.value ? (
    <span className="text-text-tertiary">{trend.value}</span>
  ) : null;

  return (
    <div className={cn(variantClasses[variant], 'rounded-2xl p-6 relative overflow-hidden', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-tertiary dark:bg-surface-tertiary">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        </div>
        {subtitle && <span className="text-xs text-text-tertiary">{subtitle}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary tracking-tight font-mono">
          {formatCurrency(value)}
        </span>
        {trend?.label && <span className="text-xs text-text-tertiary">{trend.label}</span>}
      </div>
      {trendIcon && (
        <div className="mt-2 flex items-center gap-1">
          {trendIcon}
        </div>
      )}
    </div>
  );
}
