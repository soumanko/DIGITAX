import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

/**
 * POST /api/auth/mfa/challenge
 * Generates a new MFA challenge for verification.
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  // Rate limit: 10 per minute per IP (strict)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const rateLimit = rateLimiters.strict(`mfa-challenge:${ip}`);
  const limitResponse = rateLimitResponse(rateLimit);
  if (limitResponse.blocked) {
    return limitResponse.response as Response;
  }

  const ctx = await getAuthenticatedContext();
  if (!ctx.userId || !ctx.shop) {
    return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.auth.mfa as unknown as { challenge: (params: { factorId: string }) => Promise<{ data: { challengeId: string } | null; error: Error | null }> }).challenge({
    factorId: ctx.userId,
  });

  if (error) {
    console.error('MFA challenge error:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }

  return NextResponse.json({ challengeId: data?.challengeId });
}