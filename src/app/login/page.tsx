'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleAlert, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <main className="bg-[#e5e5e5]/40 flex relative px-6 py-10 justify-center items-center min-h-screen overflow-hidden sm:px-10 backdrop-blur-sm">
          <div className="-translate-1/2 pointer-events-none rounded-full border border-border/70 hidden absolute top-1/2 left-1/2 size-[34rem] lg:block" />
          <div className="-translate-1/2 pointer-events-none rounded-full border border-border/70 hidden absolute top-1/2 left-1/2 size-[24rem] lg:block" />
          <div
            aria-hidden="true"
            className="rotate-12 pointer-events-none shadow-lg rounded-sm bg-primary hidden absolute top-[16%] left-[14%] size-24 lg:block"
          />
          <div
            aria-hidden="true"
            className="-rotate-12 pointer-events-none shadow-lg rounded-sm bg-primary/80 hidden absolute top-[34%] left-1/5 size-16 lg:block"
          />
          <div
            aria-hidden="true"
            className="-rotate-12 pointer-events-none shadow-lg rounded-sm bg-primary/90 hidden absolute bottom-[17%] left-[27%] size-28 lg:block"
          />
          <div
            aria-hidden="true"
            className="-rotate-12 pointer-events-none shadow-lg rounded-sm bg-primary hidden absolute top-[15%] right-[15%] size-36 lg:block"
          />
          <div
            aria-hidden="true"
            className="-rotate-12 pointer-events-none shadow-lg rounded-sm bg-primary/85 hidden absolute top-[34%] right-[21%] size-20 lg:block"
          />
          <div
            aria-hidden="true"
            className="rotate-12 pointer-events-none shadow-lg rounded-sm bg-primary/90 hidden absolute right-1/4 bottom-[18%] size-24 lg:block"
          />
          <div
            aria-hidden="true"
            className="-rotate-12 pointer-events-none shadow-lg rounded-sm bg-primary hidden absolute right-[18%] bottom-[23%] size-10 lg:block"
          />
          <div className="relative z-10 w-full max-w-md">
            <div className="flex mb-8 justify-center items-center gap-3">
              <img
                alt="DIGITAX logo mark"
                src="/logo.svg"
                className="shadow-sm rounded-md size-10 object-cover"
              />
              <span className="font-semibold text-primary text-lg tracking-[0.18em]">
                DIGITAX
              </span>
            </div>
            <section
              aria-label="DIGITAX sign in form"
              className="shadow-lg backdrop-blur-sm rounded-2xl bg-card/95 border border-border/70 p-7 sm:p-10"
            >
              <div className="text-center">
                <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.2em]">
                  Secure workspace access
                </p>
                <h1 className="font-semibold text-primary text-3xl -tracking-[0.04em] mt-4">
                  Welcome back.
                </h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Let’s get your business back on track.
                </p>
              </div>
              <div
                role="alert"
                className="rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/30 hidden mt-7 p-3 gap-3"
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
                <CircleAlert className="mt-0.5 shrink-0 size-4" />
                <p>Sign-in could not be completed in this prototype.</p>
              </div>
              <div className="mt-8">
                <div className="mb-6">
                  <label
                    htmlFor="signin-email"
                    className="font-medium text-primary text-xs mb-2"
                  >
                    Username
                  </label>
                  <Input
                    defaultValue=""
                    id="signin-email"
                    placeholder="you@business.com"
                    type="email"
                    className="shadow-none rounded-none bg-transparent text-sm border-t-0 border-r-0 border-b-input border-l-0 px-0 h-9 focus-visible:ring-0"
                  />
                </div>
                <div className="mb-6">
                  <div className="flex mb-2 justify-between items-center">
                    <label
                      htmlFor="signin-password"
                      className="font-medium text-primary text-xs"
                    >
                      Password
                    </label>
                    <Link
                      href="/reset-password"
                      className="transition-colors text-muted-foreground text-xs hover:text-primary"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      defaultValue=""
                      id="signin-password"
                      placeholder="Enter your password"
                      type="text"
                      className="shadow-none rounded-none bg-transparent text-sm border-t-0 border-r-0 border-b-input border-l-0 hidden pr-8 pl-0 h-9 focus-visible:ring-0"
                    />
                    <Input
                      defaultValue=""
                      id="signin-password"
                      placeholder="Enter your password"
                      type="password"
                      className="shadow-none rounded-none bg-transparent text-sm border-t-0 border-r-0 border-b-input border-l-0 pr-8 pl-0 h-9 focus-visible:ring-0"
                    />
                    <button
                      aria-label="Toggle password visibility"
                      type="button"
                      className="transition-colors text-muted-foreground absolute right-0 bottom-2 hover:text-primary"
                    >
                      <EyeOff className="hidden size-4" />
                      <Eye className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="flex mb-6 items-center gap-3">
                  <Checkbox defaultChecked={false} id="remember-me" />
                  <label
                    htmlFor="remember-me"
                    className="text-muted-foreground text-xs"
                  >
                    Remember me on this device
                  </label>
                </div>
                <Button
                  type="button"
                  className="font-semibold shadow-sm rounded-full bg-primary text-primary-foreground text-xs w-full h-11 hover:bg-primary/90"
                  onClick={() => {
                    // Sign-in handled by existing auth flow
                  }}
                >
                  Sign in
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
              <div className="text-center mt-7 inline-flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  New to DIGITAX?
                </span>
                <Link
                  href="/register"
                  className="font-semibold transition-colors text-primary text-xs hover:text-accent"
                >
                  Create an account
                </Link>
              </div>
            </section>
            <div className="text-muted-foreground text-xs flex mt-6 justify-center items-center gap-4">
              <a
                href="/"
                className="transition-colors hover:text-primary"
                onClick={handleBackToHome}
              >
                Back to home
              </a>
              <span className="rounded-full bg-border size-1" />
              <span>© 2026 DIGITAX</span>
            </div>
          </div>
        </main>
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
          disabled={loading}
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