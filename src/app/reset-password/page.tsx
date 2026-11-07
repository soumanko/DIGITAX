'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'email' | 'confirm'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setStep('confirm');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-secondary">
        <div className="sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-success-100 dark:bg-success-900/20 flex items-center justify-center shadow-lg shadow-success-500/20">
              <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
            Check your email
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            A password reset link has been sent to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
          <Link href="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:hover:text-primary-400">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-secondary">
      <div className="sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>
        {step === 'email' ? (
          <>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
              Reset your password
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <Card className="mx-auto border border-border bg-surface shadow-sm">
              <CardContent className="pt-6 pb-4">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-error-50 dark:bg-error-50/20 border border-error-200 dark:border-error-800 text-xs text-error-700 dark:text-error-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRequestReset} className="space-y-4">
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

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={loading}
                  >
                    Send Reset Link
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="border-t border-border bg-surface-secondary/50 py-3 text-center text-xs text-text-tertiary">
                <span className="flex items-center justify-center gap-1 w-full">
                  Remember your password?{' '}
                  <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500 dark:hover:text-primary-400">
                    Sign in
                  </Link>
                </span>
              </CardFooter>
            </Card>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
              Reset Password
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Create a new password for your account.
            </p>

            <Card className="mx-auto border border-border bg-surface shadow-sm">
              <CardContent className="pt-6 pb-4">
                <form className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pl-10 pr-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    className="w-full mt-2"
                    disabled
                  >
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        <p className="mt-6 text-xs text-text-secondary">
          Didn&apos;t receive an email? Check your spam folder or{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500 dark:hover:text-primary-400">
            try signing in
          </Link>
        </p>
      </div>
    </div>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
