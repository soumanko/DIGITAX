import { NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';

/**
 * GET /api/shops/list
 * Lists all shops the authenticated user is a member of.
 * Enforces server-side membership verification.
 */
export async function GET() {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit: 100 per minute per user
    const rateLimit = rateLimiters.relaxed(`shops-list:${ctx.userId}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const supabase = await createClient();

    // Get all shops where the user is a member (owner or member)
    const { data: memberships, error } = await supabase
      .from('shop_members')
      .select(`
        role,
        shops (
          id, name, gstin, state, state_code, business_type, taxpayer_scheme,
          preferred_language, created_at
        )
      `)
      .eq('user_id', ctx.userId);

    if (error) {
      console.error('Error fetching shop memberships:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const shops = (memberships || []).map((m: { shops: Array<Record<string, unknown>>; role: string }) => {
      const shop = m.shops[0];
      if (!shop) return null;
      return { ...shop, userRole: m.role };
    }).filter(Boolean);

    return NextResponse.json({
      shops,
      total: shops.length,
      activeShopId: ctx.shop?.id || null,
    });
  } catch (err) {
    console.error('Error fetching shop list:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}