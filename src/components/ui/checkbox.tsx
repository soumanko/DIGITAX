'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, defaultChecked, checked, onCheckedChange, id, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        id={id}
        defaultChecked={defaultChecked}
        checked={checked}
        onCheckedChange={handleChange}
        className={cn(
          'h-4 w-4 shrink-0 rounded border-border ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

const CheckboxIndicator = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator>
>(({ className, children, ...props }, ref) => (
  <CheckboxPrimitive.Indicator
    ref={ref}
    className={cn(
      'flex items-center justify-center text-current',
      className
    )}
    {...props}
  >
    <Check className="h-4 w-4" />
  </CheckboxPrimitive.Indicator>
));
CheckboxIndicator.displayName = 'CheckboxIndicator';

export { Checkbox, CheckboxIndicator };
