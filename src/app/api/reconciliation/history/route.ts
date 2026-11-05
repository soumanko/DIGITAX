import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

/**
 * GET /api/reconciliation/history
 * Lists reconciliation matches with transaction and invoice details.
 * Enforces multi-tenant isolation — only matches belonging to the user's shop.
 *
 * Query params:
 *   - limit: max results (default 50, max 100)
 *   - offset: pagination offset (default 0)
 *   - match_status: filter by status
 *   - dateFrom, dateTo: date range filter
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit: 100 per minute per shop
    const rateLimit = rateLimiters.relaxed(`reconciliation-history:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const matchStatus = searchParams.get('match_status') || undefined;
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;

    const supabase = await createClient();

    let query = supabase
      .from('reconciliation_matches')
      .select(`
        *,
        transactions (
          id, reference, amount, transaction_type, transaction_date, description
        ),
        invoices (
          id, invoice_number, invoice_type, total_amount, invoice_date, customer_name
        )
      `, { count: 'exact' })
      .eq('shop_id', ctx.shop.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchStatus) {
      query = query.eq('match_status', matchStatus);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: matches, error, count } = await query;

    if (error) {
      console.error('Error fetching reconciliation history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      matches: matches || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (matches || []).length,
      shopId: ctx.shop.id,
    });
  } catch (err) {
    console.error('Error fetching reconciliation history:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/reconciliation/history/[id]
 * Unmatches (deletes) a reconciliation match.
 * Enforces multi-tenant isolation and audit logging.
 */
export async function DELETE(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit: 30 per minute per shop
    const rateLimit = rateLimiters.moderate(`reconciliation-unmatch:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify match exists and belongs to shop before deleting
    const { data: existingMatch, error: fetchError } = await supabase
      .from('reconciliation_matches')
      .select('*')
      .eq('id', matchId)
      .eq('shop_id', ctx.shop.id)
      .single();

    if (fetchError || !existingMatch) {
      return NextResponse.json({ error: 'Reconciliation match not found' }, { status: 404 });
    }

    // Delete the match (cascade updates transaction/invoice status via triggers)
    const { error: deleteError } = await supabase
      .from('reconciliation_matches')
      .delete()
      .eq('id', matchId)
      .eq('shop_id', ctx.shop.id);

    if (deleteError) {
      console.error('Error deleting reconciliation match:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log audit event
    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'reconciliation_unmatched',
      entityType: 'reconciliation_match',
      entityId: matchId,
      metadata: {
        transactionId: existingMatch.transaction_id,
        invoiceId: existingMatch.invoice_id,
        allocatedAmount: existingMatch.allocated_amount,
        previousStatus: existingMatch.match_status,
      },
    });

    return NextResponse.json({ success: true, message: 'Reconciliation match removed' });
  } catch (err) {
    console.error('Error unmatching reconciliation:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}