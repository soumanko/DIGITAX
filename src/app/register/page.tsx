'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi' | 'bn' | 'mr'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            shop_name: shopName,
            preferred_language: preferredLanguage,
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/confirm?next=/onboarding`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If email confirmation is required, session will be null
      if (data?.user && !data.session) {
        setConfirmationNeeded(true);
        setLoading(false);
        return;
      }

      // Successful registration with active session proceeds to shop onboarding
      router.push('/onboarding');
    } catch (err: any) {
      setError(err?.message || 'Registration service is unavailable. Please check your network connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-secondary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="font-extrabold text-2xl text-text-primary tracking-tight">DIGITAX</span>
        </Link>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Create your business account
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-border">
          <CardContent className="pt-6">
            {confirmationNeeded ? (
              <div className="text-center py-6 space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-text-primary">Verify your business email</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  We have sent a verification link to <strong className="text-text-primary">{email}</strong>. Please check your inbox and click the link to activate your shop account.
                </p>
                <div className="pt-4 space-y-2">
                  <Link href="/login">
                    <Button variant="primary" className="w-full">
                      Proceed to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Owner / Manager Full Name
                </label>
                <Input
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Shop / Business Name
                </label>
                <Input
                  required
                  placeholder="e.g. Shree Krishna General Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="rajesh@krishnastore.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Password (min 8 characters)
                </label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Preferred Language for Assistant & Voice
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                >
                  <option value="en">English (Default)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={loading}
                >
                  Register Business <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        )}
      </CardContent>
          <CardFooter className="border-t border-border bg-surface-secondary/50 py-3 text-center text-xs text-text-tertiary">
            <span className="flex items-center justify-center gap-1 w-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Free 30-day trial • No credit card required
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
