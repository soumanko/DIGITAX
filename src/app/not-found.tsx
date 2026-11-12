'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Compass,
  House,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * App-wide not-found renderer (Next.js convention). Any unmatched URL lands
 * here with the designed 404 layout and real, honest CTAs. The standalone
 * `/404` route re-uses the same layout.
 */
export default function NotFound() {
  const router = useRouter();
  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <header className="bg-background border-t border-r border-b border-b-border border-l-border w-full">
          <div className="flex mx-auto px-6 justify-between items-center w-full h-16 max-w-7xl">
            <Link href="/" className="font-bold text-foreground text-lg tracking-tight">
              DIGITAX
            </Link>
            <nav
              aria-label="Primary navigation"
              className="flex items-center gap-7"
            >
              <Link
                href="/#product"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Product
              </Link>
              <Link
                href="/#gst-compliance"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                GST compliance
              </Link>
              <Link
                href="/#pricing"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Pricing
              </Link>
              <Link
                href="/#resources"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Resources
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/sign-in"
                className="font-semibold rounded-md text-foreground text-sm border border-border px-4 py-2 hover:bg-accent"
              >
                Sign in
              </a>
              <a
                href="/register"
                className="font-semibold rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 hover:bg-primary/90"
              >
                Get started
              </a>
            </div>
          </div>
        </header>
        <main className="text-center flex mx-auto px-6 py-20 flex-col items-center w-full max-w-3xl">
          <div className="shadow-sm rounded-2xl bg-card border border-border flex justify-center items-center size-24">
            <Compass strokeWidth={1.5} className="text-primary size-12" />
          </div>
          <p className="font-semibold text-muted-foreground text-sm tracking-widest mt-8">
            ERROR 404
          </p>
          <h1 className="font-bold text-foreground text-4xl tracking-tight mt-4">
            This page took a wrong turn.
          </h1>
          <p className="text-muted-foreground text-base leading-7 mt-4 max-w-xl">
            The link may be outdated or the page may have moved. Let&rsquo;s get
            you back to a useful place.
          </p>
          <div className="flex mt-8 items-center gap-3">
            <Button
              className="rounded-md bg-primary text-primary-foreground px-5 hover:bg-primary/90"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to dashboard
            </Button>
            <Button
              variant="outline"
              className="rounded-md px-5"
              onClick={() => router.push('/')}
            >
              <House className="mr-2 size-4" />
              Go to homepage
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mt-8">
            Need a hand?
            <a
              href="/faq"
              className="font-medium text-primary hover:underline"
            >
              Contact support
            </a>
          </p>
        </main>
        <footer className="text-muted-foreground text-sm border-x border-t border-t-border border-b-border flex mx-auto p-6 justify-between items-center w-full max-w-7xl">
          <span className="font-bold text-foreground tracking-tight">
            DIGITAX
          </span>
          <span>Financial clarity for ambitious teams.</span>
          <span>© 2024 DIGITAX</span>
        </footer>
      </div>
    </div>
  );
}
