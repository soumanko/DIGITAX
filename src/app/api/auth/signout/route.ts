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
  } catch {
    // Graceful offline/demo fallback
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  // Clear demo session cookie
  response.cookies.set('dx_demo_session', '', { maxAge: 0, path: '/' });
  return response;
}
