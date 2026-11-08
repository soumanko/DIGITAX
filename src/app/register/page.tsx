'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ShieldCheck, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  gstin: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    gstin: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const validation = registerSchema.safeParse(formData);
      if (!validation.success) {
        setError(validation.error.issues[0]?.message || 'Invalid input');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
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
      setError('Account created. Please check your email to confirm your address.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
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
    <Card className="border border-border bg-surface shadow-sm max-w-md">
      <CardContent className="pt-6 pb-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-50 dark:bg-error-50/20 border border-error-200 dark:border-error-800 text-xs text-error-700 dark:text-error-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Business Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                required
                placeholder="Shree Krishna Traders"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">GSTIN (optional)</label>
            <div className="relative">
              <Card className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 bg-surface border border-border flex items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] text-text-tertiary font-mono">IN</span>
              </Card>
              <Input
                placeholder="27AABCS1429B1ZB"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-1">15-character GSTIN with state code prefix</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                type="email"
                required
                placeholder="owner@yourshop.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-text-secondary">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="new-password"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7h9.543c-.477.208-.948.422-1.425.825zM18 12a6 6 0 11-6-6 6 6 0 016 6z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7h9.543c-.477.208-.948.422-1.425.825zM18 12a6 6 0 11-6-6 6 6 0 016-6 6 6 0 016-6z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Confirm Password</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={loading}
          >
            Create Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t border-border bg-surface-secondary/50 py-3 text-center text-xs text-text-tertiary">
        <span className="flex items-center justify-center gap-1 w-full">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500 dark:hover:text-primary-400">
            Sign in
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-secondary">
      <div className="sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-white font-bold text-xl">D</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
          Create your business account
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Join DIGITAX to manage your GST bookkeeping and invoicing.
        </p>

        <div className="mx-auto">
          <RegisterForm />
        </div>

        <p className="mt-6 text-xs text-text-secondary">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}