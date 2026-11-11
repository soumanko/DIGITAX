'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes('://')
    ? rawRedirect
    : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication service is unavailable.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-session', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError('Demo session is not available in this environment.');
      }
    } catch {
      setError('Demo session is not available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border bg-surface shadow-sm max-w-md">
      <CardContent className="pt-6 pb-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-50 dark:bg-error-50/20 border border-error-200 dark:border-error-800 text-xs text-error-700 dark:text-error-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                type="email"
                required
                placeholder="owner@yourshop.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-text-secondary">Password</label>
              <Link
                href="/reset-password"
                className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:hover:text-primary-400"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7h9.543c-.477.208-.948.422-1.425.825zM18 12a6 6 0 01-6-6 6 6 0 016 6z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7h9.543c-.477.208-.948.422-1.425.825zM18 12a6 6 0 01-6-6 6 6 0 016-6 6 6 0 016-6z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface px-2 text-text-secondary uppercase font-semibold">
              Or instant review access
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleDemoSignIn}
          className="w-full border border-border bg-surface text-text-secondary hover:bg-surface-tertiary transition-colors"
          disabled
          title="Demo sessions are disabled in production-grade deployments. Sign in with your real business account, or register one from the Sign in / Register page."
        >
          <Sparkles className="h-4 w-4 mr-2 text-text-secondary" />
          Sign in as Demo Business
        </Button>
      </CardContent>
      <CardFooter className="border-t border-border bg-surface-secondary/50 py-3 text-center text-xs text-text-tertiary">
        <span className="flex items-center justify-center gap-1 w-full">
          <ShieldCheck className="h-3.5 w-3.5 text-success-600 dark:text-success-400" />
          Secured with row-level security & audit trail
        </span>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-secondary">
      <div className="sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-white font-bold text-xl">D</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
          Sign in to your shop
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Or{' '}
          <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-500 dark:hover:text-primary-400">
            register a new business account
          </Link>
        </p>

        <div className="mx-auto">
          <Suspense fallback={<div className="p-8 text-center text-xs text-text-tertiary">Loading login form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}