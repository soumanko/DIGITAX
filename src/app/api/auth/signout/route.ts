import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { csrfMiddleware } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    // Do not block sign-out navigation on Supabase errors, but log loudly so
    // failures are never fully silent.
    console.warn('Supabase signOut failed during sign-out:', err);
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  // Clear demo session cookie and the active-shop selection cookie, so no
  // business context survives logout.
  response.cookies.set('dx_demo_session', '', { maxAge: 0, path: '/' });
  response.cookies.set('dx_active_shop', '', { maxAge: 0, path: '/' });
  return response;
}
