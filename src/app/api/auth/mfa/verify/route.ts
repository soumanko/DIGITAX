import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

/**
 * POST /api/auth/mfa/verify
 * Verifies a TOTP code and enables MFA for the user.
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  // Rate limit: 5 per minute per IP (strict)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const rateLimit = rateLimiters.strict(`mfa-verify:${ip}`);
  const limitResponse = rateLimitResponse(rateLimit);
  if (limitResponse.blocked) {
    return limitResponse.response as Response;
  }

  const ctx = await getAuthenticatedContext();
  if (!ctx.userId || !ctx.shop) {
    return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
  }

  const supabase = await createClient();

  // Correct Supabase MFA verify semantics: verify() requires the factorId,
  // the challengeId from mfa.challenge(), and the 6-digit TOTP code. The
  // previous implementation passed challengeId as factorId — which can never
  // succeed against a real enrollment.
  const body = await request.json();
  const verifySchema = z.object({
    factorId: z.string().uuid(),
    challengeId: z.string().uuid(),
    code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  });
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid factorId, challengeId and 6-digit code are required' }, { status: 400 });
  }

  const { data, error } = await (supabase.auth.mfa as unknown as { verify: (params: { factorId: string; challengeId: string; code: string }) => Promise<{ data: unknown; error: Error | null }> }).verify({
    factorId: parsed.data.factorId,
    challengeId: parsed.data.challengeId,
    code: parsed.data.code,
  });

  if (error || !data) {
    console.error('MFA verification error:', error);
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'MFA verified successfully' });
}