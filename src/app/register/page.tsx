'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

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

      if (data?.user && !data.session) {
        setConfirmationNeeded(true);
        setLoading(false);
        return;
      }

      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration service is unavailable. Please check your network connection.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen w-screen overflow-visible">
      <main className="flex items-center justify-center min-h-screen px-6 sm:px-10 py-12 sm:py-20">
        <div className="flex flex-col items-center justify-center w-full max-w-[480px]">
          <div className="inline-flex items-center gap-2 mb-8">
            <img
              alt="DIGITAX logo mark"
              src="/logo.svg"
              className="shadow-sm rounded-md size-10 object-cover"
            />
            <span className="font-extrabold text-2xl text-foreground tracking-tight">
              DIGITAX
            </span>
          </div>

          <h1 className="text-3xl font-bold text-foreground tracking-tight text-center mb-2">
            Create your business account
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-10">
            Already registered?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-accent transition-colors"
            >
              Sign in here
            </Link>
          </p>

          <section
            aria-label="DIGITAX register form"
            className="rounded-2xl bg-card border border-border shadow-lg p-8 sm:p-10 w-full"
          >
            {confirmationNeeded ? (
              <div className="text-center py-6 space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Verify your business email
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We have sent a verification link to{' '}
                  <strong className="text-foreground">{email}</strong>. Please check your inbox and click the link to activate your shop account.
                </p>
                <div className="pt-4">
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
                  <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <label
                      htmlFor="register-full-name"
                      className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-[0.1em]"
                    >
                      Owner / Manager Full Name
                    </label>
                    <Input
                      id="register-full-name"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="bg-transparent border-b border-border border-t-0 border-l-0 border-r-0 rounded-none px-0 py-3 text-sm focus-visible:ring-0 shadow-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="register-shop-name"
                      className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-[0.1em]"
                    >
                      Shop / Business Name
                    </label>
                    <Input
                      id="register-shop-name"
                      required
                      placeholder="e.g. Shree Krishna General Store"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      autoComplete="organization"
                      className="bg-transparent border-b border-border border-t-0 border-l-0 border-r-0 rounded-none px-0 py-3 text-sm focus-visible:ring-0 shadow-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="register-email"
                      className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-[0.1em]"
                    >
                      Email Address
                    </label>
                    <Input
                      id="register-email"
                      type="email"
                      required
                      placeholder="rajesh@krishnastore.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="bg-transparent border-b border-border border-t-0 border-l-0 border-r-0 rounded-none px-0 py-3 text-sm focus-visible:ring-0 shadow-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="register-password"
                      className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-[0.1em]"
                    >
                      Password (min 8 characters)
                    </label>
                    <Input
                      id="register-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="bg-transparent border-b border-border border-t-0 border-l-0 border-r-0 rounded-none px-0 py-3 text-sm focus-visible:ring-0 shadow-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="register-language"
                      className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-[0.1em]"
                    >
                      Preferred Language for Assistant & Voice
                    </label>
                    <div className="relative">
                      <select
                        id="register-language"
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value as 'en' | 'hi' | 'bn' | 'mr')}
                        className="w-full bg-transparent border-b border-border border-t-0 border-l-0 border-r-0 rounded-none px-0 py-3 text-sm focus-visible:ring-0 shadow-none appearance-none cursor-pointer"
                      >
                        <option value="en">English (Default)</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="bn">বাংলা (Bengali)</option>
                        <option value="mr">मराठी (Marathi)</option>
                      </select>
                      <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 font-semibold shadow-sm rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    isLoading={loading}
                  >
                    Register Business <ArrowRight className="ml-2 size-4" />
                  </Button>

                  <div className="pt-4 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Free 30-day trial</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span>No credit card required</span>
                    </span>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
