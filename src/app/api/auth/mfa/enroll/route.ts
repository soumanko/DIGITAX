import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

/**
 * POST /api/auth/mfa/enroll
 * Starts MFA enrollment for the authenticated user.
 * Returns a QR code and secret for TOTP setup.
 *
 * NOTE: GNANI EVON V3.3 MFA integration uses Supabase Auth MFA.
 * Live MFA verification with Supabase: NOT VERIFIED (requires Supabase MFA configuration)
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
  const rateLimit = rateLimiters.strict(`mfa-enroll:${ip}`);
  const limitResponse = rateLimitResponse(rateLimit);
  if (limitResponse.blocked) {
    return limitResponse.response as Response;
  }

  const ctx = await getAuthenticatedContext();
  if (!ctx.userId || !ctx.shop) {
    return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
  }

  const supabase = await createClient();

  // Check if MFA is already enrolled
  const { data: existingFactors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) {
    console.error('Error listing MFA factors:', listError);
    return NextResponse.json({ error: 'Failed to check MFA enrollment' }, { status: 500 });
  }

  const allFactors = (existingFactors as { all: unknown[] })?.all || [];
  if (allFactors.length > 0) {
    return NextResponse.json({ error: 'MFA is already enrolled' }, { status: 400 });
  }

  // Start enrollment for TOTP
  const { data: enrollData, error: enrollError } = await (supabase.auth.mfa as unknown as { enroll: (params: { factorType: string; issuer: string; friendlyName: string }) => Promise<{ data: { qrCode?: string; secret?: string; uri?: string }; error: Error | null }> }).enroll({
    factorType: 'totp',
    issuer: 'DIGITAX',
    friendlyName: ctx.shop.name || 'DIGITAX',
  });

  if (enrollError) {
    console.error('MFA enrollment error:', enrollError);
    return NextResponse.json({ error: 'Failed to start MFA enrollment' }, { status: 500 });
  }

  return NextResponse.json({
    qrCode: (enrollData as { qrCode?: string; secret?: string; uri?: string }).qrCode,
    secret: (enrollData as { qrCode?: string; secret?: string; uri?: string }).secret,
    uri: (enrollData as { qrCode?: string; secret?: string; uri?: string }).uri,
  });
}