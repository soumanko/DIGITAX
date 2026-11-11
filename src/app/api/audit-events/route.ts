import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';

/**
 * GET /api/audit-events
 * Read-only feed of the compliance audit trail for the ACTIVE authorized shop.
 * RLS on audit_events additionally enforces shop-membership at the database;
 * this route resolves the shop server-side (never from client input) and
 * returns audit rows only for that shop.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const rateLimit = rateLimiters.relaxed(`audit-events:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const supabase = await createClient();
    const { data, error, count } = await supabase
      .from('audit_events')
      .select('id, shop_id, actor_id, action, entity_type, entity_id, metadata, reason, created_at', { count: 'exact' })
      .eq('shop_id', ctx.shop.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audit events:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      events: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error('Error in audit-events route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
