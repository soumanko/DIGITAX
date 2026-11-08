'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  selected: boolean;
  onChange: (value: string, selected: boolean) => void;
  className?: string;
}

export function FilterChip({ label, value, selected, onChange, className }: FilterChipProps) {
  return (
    <button
      onClick={() => onChange(value, !selected)}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all border',
        selected
          ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
          : 'bg-surface border-border text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
        className
      )}
      role="switch"
      aria-checked={selected}
    >
      {label}
      {selected && (
        <X className="h-3 w-3" aria-hidden="true" />
      )}
    </button>
  );
}

interface FilterGroupProps {
  label: string;
  options: Array<{ label: string; value: string }>;
  selectedValues: string[];
  onChange: (value: string, selected: boolean) => void;
  className?: string;
}

export function FilterGroup({ label, options, selectedValues, onChange, className }: FilterGroupProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-tighter mb-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            value={opt.value}
            selected={selectedValues.includes(opt.value)}
            onChange={(v, selected) => onChange(v, selected)}
          />
        ))}
      </div>
    </div>
  );
}
