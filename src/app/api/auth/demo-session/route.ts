import { NextResponse, type NextRequest } from 'next/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';

/**
 * Sets the demo session cookie server-side with HttpOnly flag.
 * Only available in non-production environments.
 * The cookie is NOT accessible via document.cookie (client-side JavaScript),
 * preventing XSS theft. Server-side middleware and API routes can still read it.
 *
 * Rate limited: 5 requests per minute per IP (strict).
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';

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

  const response = NextResponse.json({ success: true });
  response.cookies.set('digitax_demo_session', 'true', {
    path: '/',
    maxAge: 86400, // 24 hours
    httpOnly: true, // Not accessible via document.cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}
