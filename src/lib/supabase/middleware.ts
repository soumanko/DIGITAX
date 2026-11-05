import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { requireSupabaseConfig } from './config-validation';

export async function updateSession(request: NextRequest) {
  requireSupabaseConfig();
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  let user = null;
  const isDemoSession = request.cookies.get('dx_demo_session')?.value === 'true';
  const isDevOrTest = process.env.NODE_ENV !== 'production';

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-digitax')) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } else if (isDemoSession && isDevOrTest) {
      // Isolated mock user exclusively for local development preview.
      // This identity is clearly synthetic — never impersonates a real account.
      user = { id: 'demo-user-local-dev', email: 'demo@digitax.local' } as { id: string; email: string };
    }
  } catch (err) {
    console.warn('Supabase auth session verification failed:', err);
    // Explicitly do not grant access on network or database error
    if (isDemoSession && isDevOrTest) {
      user = { id: 'demo-user-local-dev', email: 'demo@digitax.local' } as { id: string; email: string };
    }
  }

  // Protected routes — redirect to login if not authenticated
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/documents') ||
    request.nextUrl.pathname.startsWith('/transactions') ||
    request.nextUrl.pathname.startsWith('/reconciliation') ||
    request.nextUrl.pathname.startsWith('/gst') ||
    request.nextUrl.pathname.startsWith('/assistant') ||
    request.nextUrl.pathname.startsWith('/review') ||
    request.nextUrl.pathname.startsWith('/exports') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/onboarding');

  const isApiRoute = request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/api/auth/');

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages — redirect to dashboard if already logged in
  const isAuthRoute = request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname === '/reset-password';

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Add security headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), geolocation=(), microphone=(self)'
  );

  // Content Security Policy
  const isDev = process.env.NODE_ENV !== 'production';
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://v0.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.supabase.co https://*.supabase.co https://*.supabase.functions.co https://vercel.live https://v0.dev wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (isDev) {
    // Development: allow Vite dev server and inline scripts for HMR
    cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://v0.dev ws: wss:";
    cspDirectives[3] = "connect-src 'self' https://api.supabase.co https://*.supabase.co https://*.supabase.functions.co https://vercel.live https://v0.dev ws: wss: http://localhost:3000";
  }

  supabaseResponse.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Add noindex for protected routes
  if (isProtectedRoute || isApiRoute || isAuthRoute) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return supabaseResponse;
}
