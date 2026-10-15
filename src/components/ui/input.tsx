import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary',
            error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-error-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
