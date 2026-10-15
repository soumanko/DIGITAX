'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
          aria-label="Toggle navigation"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="font-semibold text-text-primary">DIGITAX</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-64 border-r border-border bg-surface flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-lg text-text-primary tracking-tight">
            DIGITAX
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
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
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4.5 w-4.5 shrink-0',
                        isActive ? 'text-primary-600' : 'text-text-tertiary'
                      )}
                    />
                    {item.name}
                    {isActive && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-text-secondary"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
