import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopInvoicesServer, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { DEMO_SHOP, DEMO_INVOICES } from '@/lib/demo-data';
import type { Invoice } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2026', 10);
    const month = parseInt(searchParams.get('month') || '10', 10);

    const isDemoCookie = request.cookies.get('digitax_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        const summary = generateGSTPeriodSummary(DEMO_SHOP.id, year, month, DEMO_INVOICES);
        return NextResponse.json({ summary, isDemo: true, shop: DEMO_SHOP });
      }
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
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
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

    const body = await request.json();
    const { year, month, summary } = body;

    const supabase = await createClient();
    const periodStr = `${String(month).padStart(2, '0')}${year}`;

    const { data, error } = await supabase
      .from('gst_summaries')
      .insert({
        shop_id: ctx.shop.id,
        financial_year: `${year}-${year + 1}`,
        tax_period: periodStr,
        status: 'draft',
        calculation_version: '1.0.0',
        engine_version: '1.0.0',
        ruleset_version: '2026.1',
        taxable_sales: parseFloat(summary.gstr1.totalTaxableValue),
        output_cgst: parseFloat(summary.gstr3b.outward_supplies.cgst),
        output_sgst: parseFloat(summary.gstr3b.outward_supplies.sgst),
        output_igst: parseFloat(summary.gstr3b.outward_supplies.igst),
        output_cess: parseFloat(summary.gstr3b.outward_supplies.cess),
        taxable_purchases: 0,
        input_cgst: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.cgst),
        input_sgst: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.sgst),
        input_igst: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.igst),
        input_cess: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.cess),
        net_tax_liability: parseFloat(summary.netTaxPayable.total),
        details: summary,
        source_record_counts: { invoices: 0, transactions: 0 },
        invoices_included: 0,
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
      metadata: { period: periodStr, netPayable: summary.netTaxPayable.total },
    });

    return NextResponse.json({ summary: data, success: true }, { status: 201 });
  } catch (err) {
    console.error('Error saving GST summary:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to save GST summary' }, { status: 500 });
  }
}
