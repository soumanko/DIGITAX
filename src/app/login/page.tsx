'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Sanitize redirect path to prevent open redirects (must be local relative path)
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes('://')
    ? rawRedirect
    : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'configuration_required' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setConfigMissing(true);
    }
  }, [searchParams]);

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
    } catch (err: any) {
      setError(err?.message || 'Authentication service is unavailable. Please check your connection and credentials.');
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-border">
      <CardContent className="pt-6">
        {configMissing && (
          <div className="mb-4 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Supabase Configuration Required</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              To log in or register with authentication, please provide your project URL and publishable anon key in <code>.env.local</code>. Refer to <code>.env.example</code> for details.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Email address
            </label>
            <Input
              type="email"
              required
              placeholder="owner@yourshop.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-text-secondary">
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full font-semibold shadow-xs"
            isLoading={loading}
          >
            Sign In to DIGITAX
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border bg-surface-secondary/50 pt-4 pb-4">
        <p className="text-xs text-center text-text-secondary">
          Don&apos;t have a DIGITAX account?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
          >
            Register your shop
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            D
          </div>
          <span className="text-2xl font-black tracking-tight text-text-primary">
            DIGITAX
          </span>
        </div>
        <h2 className="text-center text-xl font-extrabold text-text-primary">
          Sign in to your business workspace
        </h2>
        <p className="mt-1 text-center text-xs text-text-secondary">
          Automated GST bookkeeping, bank reconciliation & CA audit pack exports
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<Card className="p-8 text-center text-xs text-text-tertiary">Loading authentication...</Card>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-tertiary">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Statutory Data Isolation & Bank-Grade SSL Encryption</span>
        </div>
      </div>
    </div>
  );
}
