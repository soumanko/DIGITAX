'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const marketingNav = [
  { name: 'Features', href: '/features' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'Security', href: '/security' },
  { name: 'FAQ', href: '/faq' },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-surface/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <span className="text-white font-bold text-base">D</span>
          </div>
          <span className="font-bold text-xl text-text-primary tracking-tight">
            DIGITAX
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {marketingNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'px-3.5 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname === item.href
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-border bg-surface animate-fade-in">
          <nav className="flex flex-col p-4 gap-1">
            {marketingNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-text-secondary hover:bg-surface-tertiary'
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
              <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                <Button variant="secondary" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMobileOpen(false)}>
                <Button variant="primary" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-bold text-lg text-text-primary">DIGITAX</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              AI-powered GST bookkeeping and filing preparation for Indian small businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">Features</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">How It Works</Link></li>
              <li><Link href="/faq" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Trust</h4>
            <ul className="space-y-2">
              <li><Link href="/security" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">Security</Link></li>
              <li><Link href="/privacy" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">Terms</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-sm text-text-secondary hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-tertiary">
            © 2026 DIGITAX. All rights reserved.
          </p>
          <p className="text-xs text-text-tertiary">
            DIGITAX is a bookkeeping preparation tool. It does not file GST returns on your behalf.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
