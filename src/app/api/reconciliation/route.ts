import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  getAuthenticatedContext,
  getShopInvoicesServer,
  getShopTransactionsServer,
  confirmReconciliationMatchServer,
} from '@/lib/supabase/server-db';
import { findMatchSuggestions } from '@/lib/reconciliation/engine';
import { confirmMatchSchema } from '@/lib/validation/schemas';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';
import { Invoice, Transaction } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const [invoices, transactions] = await Promise.all([
      getShopInvoicesServer(ctx.shop.id),
      getShopTransactionsServer(ctx.shop.id),
    ]);

    const suggestions = findMatchSuggestions(invoices as unknown as Invoice[], transactions as unknown as Transaction[]);
    return NextResponse.json({ suggestions, isDemo: false });
  } catch (err) {
    console.error('Error fetching reconciliation suggestions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Rate limit reconciliation confirmation: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`reconciliation:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
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
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: (err as ZodError).issues }, { status: 400 });
    }
    console.error('Error confirming match:', err);
    return NextResponse.json({ error: 'Failed to confirm reconciliation' }, { status: 500 });
  }
}
