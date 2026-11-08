'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const Tooltip = TooltipPrimitive.Provider;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = TooltipPrimitive.Content;

const TooltipProvider = TooltipPrimitive.Provider;

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};