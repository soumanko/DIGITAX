import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopTransactionsServer, importTransactionsBatchServer } from '@/lib/supabase/server-db';
import { DEMO_TRANSACTIONS } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const isDemoCookie = request.cookies.get('digitax_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        return NextResponse.json({ transactions: DEMO_TRANSACTIONS, isDemo: true });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const transactions = await getShopTransactionsServer(ctx.shop.id);
    return NextResponse.json({ transactions, isDemo: false });
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
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
    const { transactions } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'transactions must be a non-empty array' }, { status: 400 });
    }

    // Basic validation of fields
    for (const t of transactions) {
      if (!t.transaction_date || !t.amount || !t.direction || !t.description) {
        return NextResponse.json({
          error: 'Each transaction must include transaction_date, amount, direction, and description',
        }, { status: 400 });
      }
    }

    const imported = await importTransactionsBatchServer(ctx.shop.id, ctx.userId, transactions);
    return NextResponse.json({ transactions: imported, count: imported.length, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Error importing transactions:', err);
    return NextResponse.json({ error: err?.message || 'Failed to import transactions' }, { status: 500 });
  }
}
