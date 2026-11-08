'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-provider';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { BusinessSelector } from '@/components/layout/business-selector';
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  Link2,
  Calculator,
  MessageSquare,
  AlertTriangle,
  Download,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Reconciliation', href: '/reconciliation', icon: Link2 },
  { name: 'GST Workspace', href: '/gst', icon: Calculator },
  { name: 'AI Assistant', href: '/assistant', icon: MessageSquare },
  { name: 'Review Center', href: '/review', icon: AlertTriangle },
  { name: 'Exports', href: '/exports', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { toggleTheme, resolvedTheme } = useTheme();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    if (pathnameRef.current !== pathname) {
      setIsMobileOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-surface flex flex-col transition-transform duration-300',
          'lg:relative lg:translate-x-0 lg:z-auto lg:static',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4 shrink-0">
          <button
            onClick={() => setIsSidebarCollapsed((p) => !p)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors hidden sm:flex"
            aria-label="Collapse sidebar"
          >
            <X className="h-4 w-4" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold shadow-sm">
              D
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-text-primary tracking-tight whitespace-nowrap">
                DIGITAX
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Business Selector */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <BusinessSelector className="w-full" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-50/60 dark:bg-primary-900/20 border-r-2 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4.5 w-4.5 shrink-0',
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-text-tertiary'
                      )}
                    />
                    {!isSidebarCollapsed && item.name}
                    {isActive && !isSidebarCollapsed && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-3 shrink-0">
          <form action="/api/auth/signout" method="POST" className="w-full">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className={cn('w-full justify-start', isSidebarCollapsed ? 'justify-center px-2' : '')}
            >
              {!isSidebarCollapsed && <LogOut className="h-4 w-4 mr-2" />}
              {!isSidebarCollapsed ? 'Sign Out' : 'Sign out'}
            </Button>
          </form>
          <div className="mt-3 flex items-center gap-2 px-2">
            <ThemeSwitcher className="flex-1" size="sm" />
            <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Navigation */}
        <header
          className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md"
        >
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors lg:hidden"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Toggle navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/dashboard" className="flex items-center gap-2 hidden sm:flex">
                <div className="h-6 w-6 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold shadow-sm">
                  D
                </div>
                <span className="font-bold text-text-primary tracking-tight whitespace-nowrap">
                  DIGITAX
                </span>
              </Link>
              <span className="hidden lg:block px-3 py-1.5 rounded-lg bg-surface-tertiary text-xs font-medium text-text-tertiary">
                {pathname.replace('/', '') || 'Dashboard'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeSwitcher size="sm" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}