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

    // Compute business metrics from real data
    const totalSales = invoices
      .filter((i: any) => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
      .reduce((acc, i) => acc.plus(money(i.total_amount || '0')), money(0));
    const totalPurchases = invoices
      .filter((i: any) => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
      .reduce((acc, i) => acc.plus(money(i.total_amount || '0')), money(0));
    const totalITC = invoices
      .filter((i: any) => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
      .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));
    const totalOutputTax = invoices
      .filter((i: any) => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
      .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));
    const netTaxPayable = totalOutputTax.minus(totalITC).isNegative() ? money(0) : totalOutputTax.minus(totalITC);

    const paidInvoices = invoices.filter((i: any) => i.payment_status === 'paid').length;
    const unpaidInvoices = invoices.filter((i: any) => i.payment_status !== 'paid').length;
    const pendingReview = invoices.filter((i: any) => i.review_state === 'pending_review').length;
    const matchedTxns = transactions.filter((t: any) => t.reconciliation_status === 'matched').length;

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
      totalSales: totalSales.toString(),
      totalPurchases: totalPurchases.toString(),
      totalITC: totalITC.toString(),
      totalOutputTax: totalOutputTax.toString(),
      netTaxPayable: netTaxPayable.toString(),
      paidInvoices,
      unpaidInvoices,
      pendingReviewCount: pendingReview,
      matchedTransactions: matchedTxns,
      unmatchedTransactions: unmatched,
      invoices: (invoices || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        customer_name: inv.customer_name,
        customer_gstin: inv.customer_gstin,
        total_amount: inv.total_amount,
        payment_status: inv.payment_status,
        review_state: inv.review_state,
        direction: inv.direction,
      })),
      transactions: (transactions || []).map((txn: any) => ({
        id: txn.id,
        transaction_date: txn.transaction_date,
        description: txn.description,
        amount: txn.amount,
        transaction_type: txn.transaction_type,
        reconciliation_status: txn.reconciliation_status,
      })),
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