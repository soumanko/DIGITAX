import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedContext, getShopTransactionsServer, importTransactionsBatchServer } from '@/lib/supabase/server-db';
import { importTransactionsSchema } from '@/lib/validation/schemas';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    // Rate limit reads: 100 per minute per shop (relaxed)
    const rateLimit = rateLimiters.relaxed(`transactions-read:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const transactions = await getShopTransactionsServer(ctx.shop.id);
    return NextResponse.json({ transactions, isDemo: false });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit transaction import: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`transaction-import:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    const body = await request.json();
    const validated = importTransactionsSchema.parse(body);

    const imported = await importTransactionsBatchServer(ctx.shop.id, ctx.userId, validated.transactions);
    return NextResponse.json({ transactions: imported, count: imported.length, success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error importing transactions:', err);
    return NextResponse.json({ error: 'Failed to import transactions' }, { status: 500 });
  }
}
