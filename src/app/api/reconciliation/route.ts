import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedContext,
  getShopInvoicesServer,
  getShopTransactionsServer,
  confirmReconciliationMatchServer,
  reverseReconciliationMatchServer,
} from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { findMatchSuggestions } from '@/lib/reconciliation/engine';
import { confirmMatchSchema } from '@/lib/validation/schemas';
import { DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const isDemoCookie = request.cookies.get('digitax_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        const suggestions = findMatchSuggestions(DEMO_INVOICES, DEMO_TRANSACTIONS);
        return NextResponse.json({ suggestions, isDemo: true, matches: [] });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const supabase = await createClient();

    const [invoices, transactions, matchesRes] = await Promise.all([
      getShopInvoicesServer(ctx.shop.id),
      getShopTransactionsServer(ctx.shop.id),
      supabase
        .from('reconciliation_matches')
        .select('*')
        .eq('shop_id', ctx.shop.id)
        .order('created_at', { ascending: false }),
    ]);

    const suggestions = findMatchSuggestions(invoices as any, transactions as any);
    return NextResponse.json({
      suggestions,
      matches: matchesRes.data || [],
      isDemo: false,
    });
  } catch (err: any) {
    console.error('Error fetching reconciliation suggestions:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    const body = await request.json();
    const validated = confirmMatchSchema.parse(body);

    const match = await confirmReconciliationMatchServer(
      ctx.shop.id,
      ctx.userId,
      validated.transaction_id,
      validated.invoice_id,
      validated.allocated_amount
    );

    return NextResponse.json({ match, success: true }, { status: 201 });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 });
    }
    console.error('Error confirming match:', err);
    return NextResponse.json({ error: err?.message || 'Failed to confirm reconciliation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');
    const reason = searchParams.get('reason') || 'User requested reversal';

    if (!matchId) {
      return NextResponse.json({ error: 'match_id query parameter is required' }, { status: 400 });
    }

    const result = await reverseReconciliationMatchServer(
      ctx.shop.id,
      ctx.userId,
      matchId,
      reason
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Error reversing reconciliation match:', err);
    return NextResponse.json({ error: err?.message || 'Failed to reverse reconciliation' }, { status: 500 });
  }
}
