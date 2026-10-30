import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseEnv, getSupabaseEnv } from './env';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Protected application routes requiring active authenticated session
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

  // Auth pages (login, register, reset-password)
  const isAuthRoute = request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname === '/reset-password';

  // 1. Verify environment configuration safety
  if (!hasSupabaseEnv()) {
    console.warn(
      '[DIGITAX Security Notice] Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured. Blocking protected access.'
    );

    if (isApiRoute) {
      return NextResponse.json(
        {
          error: 'Supabase credentials unconfigured on server. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.',
        },
        { status: 503 }
      );
    }

    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'configuration_required');
      return NextResponse.redirect(url);
    }

    // Public pages (landing, /features, /faq, /how-it-works, /login) can render without crashing
    return supabaseResponse;
  }

  // 2. Initialize Supabase SSR client with validated environment
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  // 3. Verify user session directly from Supabase Auth
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch (err) {
    console.warn('[DIGITAX Auth Notice] Failed to verify Supabase session token:', err);
    // Explicitly do not grant access on error
  }

  // 4. Redirect unauthenticated users from protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 5. Redirect authenticated users away from auth pages to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 6. Security Headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), geolocation=(), microphone=(self)'
  );

  // 7. Prevent search engine indexing on protected, API, and auth routes
  if (isProtectedRoute || isApiRoute || isAuthRoute) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return supabaseResponse;
}
