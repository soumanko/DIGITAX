import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md',
        secondary:
          'bg-surface-secondary text-text-primary border border-border hover:bg-surface-tertiary hover:border-border-strong',
        accent:
          'bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow-md',
        ghost:
          'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
        destructive:
          'bg-error-600 text-white hover:bg-error-700 shadow-sm',
        link:
          'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, isLoading, children, disabled, ...props }, ref) => {
    const isSpinning = loading || isLoading;
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isSpinning}
        {...props}
      >
        {isSpinning && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
