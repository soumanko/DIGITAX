'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
    } catch (err) {
      // Ignore or log
    } finally {
      setSubmitted(true);
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
          Reset password
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Enter your email and we will send you a recovery link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-border">
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-text-primary">Password reset email sent</h3>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  If an account exists for {email}, you will receive a secure password reset link shortly.
                </p>
                <div className="pt-4">
                  <Link href="/login">
                    <Button variant="secondary" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
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
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={loading}
                >
                  Send Recovery Link
                </Button>
                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
