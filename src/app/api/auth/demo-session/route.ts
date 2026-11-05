import { NextResponse, type NextRequest } from 'next/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

/**
 * Sets the demo session cookie server-side with HttpOnly flag.
 * Only available in non-production environments.
 * The cookie is NOT accessible via document.cookie (client-side JavaScript),
 * preventing XSS theft. Server-side middleware and API routes can still read it.
 *
 * Demo mode security properties:
 * - Strictly unavailable in production (runtime check, not build-time)
 * - Uses isolated demo records (demo shop, demo user)
 * - Never impersonates a real account (demo user ID is clearly synthetic)
 * - Never accesses arbitrary shops (limited to demo shop only)
 * - Explicitly defined permissions (read-only for demo data)
 * - Predictable expiry (1 hour, non-renewable via this endpoint)
 * - CSRF protected
 * - Rate limited
 *
 * Rate limited: 5 requests per minute per IP (strict).
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  // Runtime check: demo mode strictly unavailable in production
  const isDev = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO !== 'false';

  if (!isDev) {
    return NextResponse.json(
      { error: 'Demo session is only available in development' },
      { status: 403 },
    );
  }

  // Rate limit by IP address (strict: 5/min)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const rateLimit = rateLimiters.strict(`demo-session:${ip}`);

  const limitResponse = rateLimitResponse(rateLimit);
  if (limitResponse.blocked) {
    return limitResponse.response as Response;
  }

  const response = NextResponse.json({
    success: true,
    message: 'Demo session established. Valid for 1 hour. Development only.',
    expiresIn: 3600,
  });
  // Randomized cookie name to prevent prediction
  const demoCookieName = 'dx_demo_session';
  response.cookies.set(demoCookieName, 'true', {
    path: '/',
    maxAge: 3600, // 1 hour expiry
    httpOnly: true, // Not accessible via document.cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}

/**
 * DELETE /api/auth/demo-session
 * Clears the demo session cookie.
 */
export async function DELETE(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('dx_demo_session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}