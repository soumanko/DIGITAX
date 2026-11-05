import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedContext,
  getShopInvoicesServer,
  getShopTransactionsServer,
} from '@/lib/supabase/server-db';
import { askGnaniEvon, AssistantContext } from '@/lib/ai/gnani';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';
import { DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { money } from '@/lib/decimal';
import { executeGnaniTool } from '@/lib/ai/tools/registry';

export async function POST(request: NextRequest) {
  try {
    const isDemoCookie = request.cookies.get('dx_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();
    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        // Rate limit demo assistant: 5 per minute per IP (strict)
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        const rateLimit = rateLimiters.strict(`assistant-demo:${ip}`);
        const limitResponse = rateLimitResponse(rateLimit);
        if (limitResponse.blocked) {
          return limitResponse.response as Response;
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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

    let assistantContext: AssistantContext;

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        assistantContext = {
          shopName: DEMO_SHOP.name,
          gstin: DEMO_SHOP.gstin,
          state: DEMO_SHOP.state,
          taxpayerScheme: DEMO_SHOP.taxpayer_scheme,
          unreconciledCount: DEMO_TRANSACTIONS.filter(t => t.reconciliation_status === 'unmatched').length,
          openInvoicesTotal: DEMO_INVOICES.reduce((acc, i) => acc.plus(money(i.amount_due || '0')), money(0)).toString(),
          currentPeriod: 'October 2026',
          shopId: 'shop-demo-001',
          userId: 'demo-user-local-dev',
        };
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      if (!ctx.shop) {
        return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
      }

      const [invoices, transactions] = await Promise.all([
        getShopInvoicesServer(ctx.shop.id),
        getShopTransactionsServer(ctx.shop.id),
      ]);

      const openDue = invoices.reduce((acc, i) => acc.plus(money(i.amount_due || '0')), money(0));
      const unmatched = transactions.filter(t => t.reconciliation_status === 'unmatched').length;

      assistantContext = {
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
    }

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
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Assistant service failed' }, { status: 500 });
  }
}