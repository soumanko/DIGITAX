import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';

/**
 * GET /api/auth/mfa/status
 * Checks if MFA is enrolled for the authenticated user.
 */
export async function GET() {
  const ctx = await getAuthenticatedContext();
  if (!ctx.userId || !ctx.shop) {
    return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: factors, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    console.error('Error listing MFA factors:', error);
    return NextResponse.json({ error: 'Failed to check MFA status' }, { status: 500 });
  }

  const allFactors = (factors as { all: unknown[] })?.all || [];

  return NextResponse.json({
    enabled: allFactors.length > 0,
    factors: allFactors.map((f: unknown) => {
      const ff = f as Record<string, unknown>;
      return {
        id: String(ff.id || ''),
        factorType: String(ff.factorType || ''),
        friendlyName: String(ff.friendlyName || ''),
        createdAt: String(ff.createdAt || ''),
      };
    }),
  });
}