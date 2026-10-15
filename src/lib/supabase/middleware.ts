import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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

  // Refresh session if expired, with fallback for demo/offline mode
  let user = null;
  const isDemoSession = request.cookies.get('digitax_demo_session')?.value === 'true';

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-digitax')) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } else if (isDemoSession) {
      // Mock user for offline / test preview mode
      user = { id: 'demo-user-123', email: 'rajesh@shreekrishnatraders.in' } as any;
    }
  } catch (err) {
    console.warn('Supabase auth check bypassed or offline:', err);
    if (isDemoSession) {
      user = { id: 'demo-user-123', email: 'rajesh@shreekrishnatraders.in' } as any;
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

  // Add noindex for protected routes
  if (isProtectedRoute || isApiRoute || isAuthRoute) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return supabaseResponse;
}
