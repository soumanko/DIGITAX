import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopInvoicesServer, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';
import type { Invoice } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2026', 10);
    const month = parseInt(searchParams.get('month') || '10', 10);

    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const invoices = await getShopInvoicesServer(ctx.shop.id);
    const summary = generateGSTPeriodSummary(ctx.shop.id, year, month, invoices as unknown as Invoice[]);

    return NextResponse.json({ summary, isDemo: false, shop: ctx.shop });
  } catch (err) {
    console.error('Error calculating GST summary:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit GST summary save: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`gst-summary:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    // Financial integrity: the summary is ALWAYS recomputed server-side from
    // the shop's own invoices using the GST engine — client-supplied summary
    // payloads are never persisted (tamper-resistant). Only period params are
    // accepted from the request.
    const body = await request.json();
    const year = Number(body?.year);
    const month = Number(body?.month);

    if (!Number.isInteger(year) || year < 2017 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Valid year (integer) and month (1-12) are required' }, { status: 400 });
    }

    const invoices = await getShopInvoicesServer(ctx.shop.id);
    const computed = generateGSTPeriodSummary(ctx.shop.id, year, month, invoices as unknown as Invoice[]);

    const toMoney = (v: string | number | undefined): number => {
      const n = parseFloat(String(v ?? 0));
      return Number.isFinite(n) ? n : 0;
    };

    const supabase = await createClient();
    const periodStr = `${String(month).padStart(2, '0')}${year}`;

    const { data, error } = await supabase
      .from('gst_summaries')
      .insert({
        shop_id: ctx.shop.id,
        financial_year: `${year}-${year + 1}`,
        tax_period: periodStr,
        status: 'draft',
        calculation_version: computed.calculationVersion,
        engine_version: computed.calculationVersion,
        ruleset_version: computed.rulesetVersion,
        taxable_sales: toMoney(computed.gstr1.totalTaxableValue),
        output_cgst: toMoney(computed.gstr3b.outward_supplies.cgst),
        output_sgst: toMoney(computed.gstr3b.outward_supplies.sgst),
        output_igst: toMoney(computed.gstr3b.outward_supplies.igst),
        output_cess: toMoney(computed.gstr3b.outward_supplies.cess),
        taxable_purchases: 0,
        input_cgst: toMoney(computed.gstr3b.eligible_itc.net_itc_available.cgst),
        input_sgst: toMoney(computed.gstr3b.eligible_itc.net_itc_available.sgst),
        input_igst: toMoney(computed.gstr3b.eligible_itc.net_itc_available.igst),
        input_cess: toMoney(computed.gstr3b.eligible_itc.net_itc_available.cess),
        net_tax_liability: toMoney(computed.netTaxPayable.total),
        details: computed as unknown as Record<string, unknown>,
        source_record_counts: { invoices: invoices.length, transactions: 0 },
        invoices_included: invoices.length,
        transactions_included: 0,
        unresolved_issues: 0,
        warnings: [],
        review_state: 'pending_review',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to save GST summary snapshot');
    }

    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'gst_summary_saved',
      entityType: 'gst_summary',
      entityId: data.id,
      metadata: {
        period: periodStr,
        netPayable: computed.netTaxPayable.total,
        recomputed_server_side: true,
      },
    });

    return NextResponse.json({ summary: data, success: true }, { status: 201 });
  } catch (err) {
    console.error('Error saving GST summary:', err);
    return NextResponse.json({ error: 'Failed to save GST summary' }, { status: 500 });
  }
}
