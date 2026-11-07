'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-provider';
import { useToast } from '@/components/ui/toast';
import { Shop } from '@/types';
import {
  ChevronDown,
  Building2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BusinessSelectorProps {
  className?: string;
}

export function BusinessSelector({ className }: BusinessSelectorProps) {
  const router = useRouter();
  const { toggleTheme, resolvedTheme } = useTheme();
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState<Shop[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Shop | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function loadBusinesses() {
    try {
      const res = await fetch('/api/shops/list');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.shops || []);
        if (data.activeShopId) {
          const active = data.shops.find((s: Shop) => s.id === data.activeShopId);
          setActiveBusiness(active || null);
        }
      }
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadBusinesses(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function switchBusiness(shopId: string) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shops/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveBusiness(data.shop || null);
        setIsDropdownOpen(false);
        router.refresh();
      } else {
        showToast({
          type: 'error',
          title: 'Switch failed',
          description: 'Unable to switch to this business.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Switch failed',
        description: 'Network error while switching business.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (businesses.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-all text-sm font-medium',
          isDropdownOpen && 'bg-surface-secondary border-primary-500/50'
        )}
        aria-expanded={isDropdownOpen}
        aria-label="Select business"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shadow-sm">
            {activeBusiness ? initials(activeBusiness.name) : '??'}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-text-primary">
              {activeBusiness?.name || 'Select Business'}
            </span>
            {activeBusiness?.gstin && (
              <span className="text-xs text-text-tertiary font-mono">
                {activeBusiness.gstin}
              </span>
            )}
          </div>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </div>
      </button>

      {isDropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-2xl shadow-2xl z-50 animate-scale-in"
        >
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-tighter">
              Active Business
            </p>
          </div>
          <div className="py-2">
            {businesses.map((biz) => (
              <button
                key={biz.id}
                onClick={() => switchBusiness(biz.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-border/50 last:border-0',
                  activeBusiness?.id === biz.id
                    ? 'bg-primary-50/50 border-primary-100/50 text-primary-600'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                )}
              >
                <div className="h-8 w-8 rounded-lg bg-surface-tertiary flex items-center justify-center text-xs font-medium text-text-primary">
                  {initials(biz.name)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-text-primary">{biz.name}</div>
                  {biz.gstin && (
                    <div className="text-xs text-text-tertiary font-mono">
                      {biz.gstin}
                    </div>
                  )}
                </div>
                {activeBusiness?.id === biz.id && (
                  <ShieldCheck className="h-4 w-4 text-success-600 dark:text-success-400" />
                )}
              </button>
            ))}
          </div>
          {businesses.length > 1 && (
            <div className="p-3 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push('/onboarding')}>
                Add New Business
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function initials(name: string | null | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
