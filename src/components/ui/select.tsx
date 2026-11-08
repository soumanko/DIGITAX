'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = SelectPrimitive.Trigger;

const SelectContent = SelectPrimitive.Content;

const SelectItem = SelectPrimitive.Item;

const SelectSeparator = SelectPrimitive.Separator;

const SelectScrollDownButton = SelectPrimitive.ScrollDownButton;

const SelectScrollUpButton = SelectPrimitive.ScrollUpButton;

type SelectProps = React.ComponentProps<typeof Select>;

type SelectGroupProps = React.ComponentProps<typeof SelectGroup>;

type SelectValueProps = React.ComponentProps<typeof SelectValue>;

type SelectTriggerProps = React.ComponentProps<typeof SelectTrigger>;

type SelectContentProps = React.ComponentProps<typeof SelectContent>;

type SelectItemProps = React.ComponentProps<typeof SelectItem>;

type SelectSeparatorProps = React.ComponentProps<typeof SelectSeparator>;

type SelectScrollDownButtonProps = React.ComponentProps<
  typeof SelectScrollDownButton
>;

type SelectScrollUpButtonProps = React.ComponentProps<
  typeof SelectScrollUpButton
>;

const SelectItemIcon = (
  props: { className?: string; children?: React.ReactNode }
) => {
  const { className, children, ...itemProps } = props;
  return (
    <SelectPrimitive.ItemIndicator
      className={cn(
        'flex items-center justify-center w-6 text-primary-foreground',
        className
      )}
      {...itemProps}
    >
      <Check className="h-4 w-4" />
    </SelectPrimitive.ItemIndicator>
  );
};

const SelectItemText = (
  props: React.ComponentProps<typeof SelectPrimitive.ItemText>
) => {
  const { className, ...itemProps } = props;
  return (
    <SelectPrimitive.ItemText
      className={cn('w-full truncate', className)}
      {...itemProps}
    />
  );
};

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectItemIcon,
  SelectItemText,
  type SelectProps,
  type SelectGroupProps,
  type SelectValueProps,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectItemProps,
  type SelectSeparatorProps,
  type SelectScrollDownButtonProps,
  type SelectScrollUpButtonProps,
};