import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

  // MFA challenge: the FACTOR id (from enrollment) must be supplied by the
  // client — a user id is not a factor id and can never start a challenge.
  let factorId: string | undefined;
  try {
    const body = await request.json();
    const parsed = z.object({ factorId: z.string().uuid() }).safeParse(body ?? {});
    if (parsed.success) factorId = parsed.data.factorId;
  } catch {
    // Empty body -> factorId stays undefined
  }

  if (!factorId) {
    return NextResponse.json({ error: 'A valid enrolled factorId (UUID) is required' }, { status: 400 });
  }

  const { data, error } = await (supabase.auth.mfa as unknown as { challenge: (params: { factorId: string }) => Promise<{ data: { challengeId: string } | null; error: Error | null }> }).challenge({
    factorId,
  });

  if (error || !data?.challengeId) {
    console.error('MFA challenge error:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }

  return NextResponse.json({ challengeId: data?.challengeId });
}