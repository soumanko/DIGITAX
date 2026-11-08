'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-provider';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeSwitcher({ className, size = 'sm' }: ThemeSwitcherProps) {
  const { theme, toggleTheme, resolvedTheme } = useTheme();

  const icon = resolvedTheme === 'dark' ? (
    <Sun className="h-4 w-4" />
  ) : (
    <Moon className="h-4 w-4" />
  );

  const sizeClasses = size === 'sm' ? 'h-8 w-8 p-1' : 'h-10 w-10 p-1.5';

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(sizeClasses, className)}
      onClick={toggleTheme}
      aria-label="Switch theme"
      title={theme === 'system' ? `System (${resolvedTheme})` : theme}
    >
      {icon}
      <span className="sr-only">
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </span>
    </Button>
  );
}
