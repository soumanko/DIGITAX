'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Eye, Globe2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function DIGITAXSignIn() {
  const router = useRouter();
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

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication service is unavailable.');
      setLoading(false);
    }
  };

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
              <a
                href="#product"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Product
              </a>
              <a
                href="#gst-compliance"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                GST compliance
              </a>
              <a
                href="#pricing"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Pricing
              </a>
              <a
                href="#resources"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Resources
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/sign-in"
                className="font-semibold rounded-md text-foreground text-sm border border-border px-4 py-2 hover:bg-accent"
              >
                Sign in
              </a>
              <Link
                href="/register"
                className="font-semibold rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 hover:bg-primary/90"
              >
                Get started
              </Link>
            </div>
          </div>
        </header>
        <main className="grid mx-auto px-6 py-16 gap-12 grid-cols-2 w-full max-w-5xl">
          <section className="flex pr-8 flex-col justify-center">
            <p className="font-semibold text-primary text-sm tracking-widest">
              WELCOME BACK
            </p>
            <h1 className="font-bold text-foreground text-4xl tracking-tight mt-4">
              A clearer view of your business starts here.
            </h1>
            <p className="text-muted-foreground text-base leading-7 mt-5 max-w-md">
              Sign in to continue to your DIGITAX workspace and keep every rupee
              accounted for.
            </p>
            <div className="flex mt-8 flex-col gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary size-5" />
                <span className="text-foreground text-sm">GST-ready books</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary size-5" />
                <span className="text-foreground text-sm">
                  Bank sync that stays current
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary size-5" />
                <span className="text-foreground text-sm">
                  Reports your team can trust
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-12">
              Trusted by finance teams across India
            </p>
          </section>
          <section className="flex flex-col items-center">
            <Card className="shadow-sm rounded-xl border-border w-full max-w-md">
              <CardHeader className="gap-2">
                <CardTitle className="text-2xl">Sign in to DIGITAX</CardTitle>
                <CardDescription>
                  Use your work email to access your workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-error-50 dark:bg-error-50/20 border border-error-200 dark:border-error-800 text-xs text-error-700 dark:text-error-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="work-email">Work email</Label>
                    <Input
                      id="work-email"
                      placeholder="you@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        placeholder="Enter your password"
                        className="pr-10"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Eye className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked={false} id="remember-me" />
                      <Label
                        htmlFor="remember-me"
                        className="font-normal text-sm"
                      >
                        Remember me
                      </Label>
                    </div>
                    <a
                      href="/reset-password"
                      className="font-medium text-primary text-sm hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                    Sign in
                  </Button>
                </form>
                <div className="flex items-center gap-3">
                  <div className="bg-border grow shrink h-px basis-[0%]" />
                  <span className="text-muted-foreground text-sm">or</span>
                  <div className="bg-border grow shrink h-px basis-[0%]" />
                </div>
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                  <Globe2 className="mr-2 size-4" />
                  Continue with Google
                </Button>
              </CardContent>
            </Card>
            <div className="text-sm flex mt-6 items-center gap-2">
              <span className="text-muted-foreground">New to DIGITAX?</span>
              <a
                href="/register"
                className="font-medium rounded-md text-foreground border border-border px-3 py-2 hover:bg-accent"
              >
                Create an account
              </a>
            </div>
            <p className="text-center text-muted-foreground text-xs mt-8">
              By continuing, you agree to the
              <a href="/terms" className="underline hover:text-foreground">
                Terms
              </a>
              and
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}