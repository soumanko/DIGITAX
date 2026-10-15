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
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('fetch') || signUpError.message.includes('dummy')) {
          // Fallback to local demo session
          document.cookie = 'digitax_demo_session=true; path=/; max-age=86400; SameSite=Lax';
          router.push('/onboarding');
          return;
        }
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Successful registration proceeds to shop onboarding
      document.cookie = 'digitax_demo_session=true; path=/; max-age=86400; SameSite=Lax';
      router.push('/onboarding');
    } catch (err: any) {
      document.cookie = 'digitax_demo_session=true; path=/; max-age=86400; SameSite=Lax';
      router.push('/onboarding');
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
