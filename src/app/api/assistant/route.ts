import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedContext,
  getShopInvoicesServer,
  getShopTransactionsServer,
} from '@/lib/supabase/server-db';
import { askGnaniEvon, AssistantContext } from '@/lib/ai/gnani';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';
import { money } from '@/lib/decimal';
import { executeGnaniTool } from '@/lib/ai/tools/registry';

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      // Rate limit assistant: 5 per minute per user (strict, AI operations are expensive)
      const rateLimit = rateLimiters.strict(`assistant:${ctx.userId}`);
      const limitResponse = rateLimitResponse(rateLimit);
      if (limitResponse.blocked) {
        return limitResponse.response as Response;
      }
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    const body = await request.json();

    // Handle tool call requests
    if (body.tool) {
      const result = await executeGnaniTool(body.tool, body.args, request.headers);
      return NextResponse.json(result);
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const [invoices, transactions] = await Promise.all([
      getShopInvoicesServer(ctx.shop.id),
      getShopTransactionsServer(ctx.shop.id),
    ]);

    const openDue = invoices.reduce((acc, i) => acc.plus(money(i.amount_due || '0')), money(0));
    const unmatched = transactions.filter(t => t.reconciliation_status === 'unmatched').length;

    const assistantContext: AssistantContext = {
      shopName: ctx.shop.name,
      gstin: ctx.shop.gstin,
      state: ctx.shop.state || 'Maharashtra',
      taxpayerScheme: ctx.shop.taxpayer_scheme || 'regular',
      unreconciledCount: unmatched,
      openInvoicesTotal: openDue.toString(),
      currentPeriod: 'Current Month',
      shopId: ctx.shop.id,
      userId: ctx.userId,
    };

    const { messages, language = 'en' } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Limit messages history to last 10 to keep context bounded
    const boundedMessages = messages.slice(-10);

    const reply = await askGnaniEvon(boundedMessages, assistantContext, language);

    return NextResponse.json(reply);
  } catch (err) {
    console.error('Error in assistant API:', err);
    return NextResponse.json({ error: 'Assistant service failed' }, { status: 500 });
  }
}