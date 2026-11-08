'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
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

      setError('Account created. Please check your email to confirm your address.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
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