'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleAlert, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

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
      </div>
    </div>
  );
}
