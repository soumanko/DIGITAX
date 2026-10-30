import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopInvoicesServer, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { DEMO_SHOP, DEMO_INVOICES } from '@/lib/demo-data';

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
        return NextResponse.json({ summary, isDemo: true, shop: DEMO_SHOP, snapshots: [] });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const supabase = await createClient();
    const periodStr = `${String(month).padStart(2, '0')}${year}`;

    const [invoices, snapshotsRes] = await Promise.all([
      getShopInvoicesServer(ctx.shop.id),
      supabase
        .from('gst_summaries')
        .select('*')
        .eq('shop_id', ctx.shop.id)
        .eq('tax_period', periodStr)
        .order('created_at', { ascending: false }),
    ]);

    // Calculate server-authoritative GST summary from persisted business invoices
    const summary = generateGSTPeriodSummary(ctx.shop.id, year, month, invoices as any);

    return NextResponse.json({
      summary,
      isDemo: false,
      shop: ctx.shop,
      snapshots: snapshotsRes.data || [],
    });
  } catch (err: any) {
    console.error('Error calculating GST summary:', err);
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
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json({ error: 'year and month are required' }, { status: 400 });
    }

    // Always re-calculate on server from authorized records - do not trust client summary
    const invoices = await getShopInvoicesServer(ctx.shop.id);
    const summary = generateGSTPeriodSummary(ctx.shop.id, parseInt(year, 10), parseInt(month, 10), invoices as any);

    const supabase = await createClient();
    const periodStr = `${String(month).padStart(2, '0')}${year}`;
    const fyStr = month >= 4 ? `${year}-${Number(year) + 1}` : `${Number(year) - 1}-${year}`;

    const { data, error } = await supabase
      .from('gst_summaries')
      .insert({
        shop_id: ctx.shop.id,
        financial_year: fyStr,
        tax_period: periodStr,
        return_type: 'GSTR-3B',
        taxable_sales: parseFloat(summary.gstr1.totalTaxableValue),
        exempt_sales: 0,
        total_sales: parseFloat(summary.gstr1.totalTaxableValue) + parseFloat(summary.gstr1.totalTax),
        taxable_purchases: 0,
        total_purchases: 0,
        output_cgst: parseFloat(summary.gstr3b.outward_supplies.cgst),
        output_sgst: parseFloat(summary.gstr3b.outward_supplies.sgst),
        output_igst: parseFloat(summary.gstr3b.outward_supplies.igst),
        output_cess: parseFloat(summary.gstr3b.outward_supplies.cess),
        input_cgst: parseFloat(summary.gstr3b.eligible_itc.all_other_itc.cgst),
        input_sgst: parseFloat(summary.gstr3b.eligible_itc.all_other_itc.sgst),
        input_igst: parseFloat(summary.gstr3b.eligible_itc.all_other_itc.igst),
        input_cess: parseFloat(summary.gstr3b.eligible_itc.all_other_itc.cess),
        net_tax_liability: parseFloat(summary.netTaxPayable.total),
        source_record_counts: {
          invoices: invoices.length,
          b2b: summary.gstr1.b2b.invoiceCount,
          b2c: summary.gstr1.b2c_small.taxableValue !== '0.00' ? 1 : 0,
        },
        invoices_included: invoices.length,
        transactions_included: 0,
        unresolved_issues: 0,
        calculation_version: '1.0.0',
        engine_version: '1.0.0',
        ruleset_version: '2026.1',
        status: 'draft',
        review_state: 'pending_review',
        details: summary as any,
        generated_by: ctx.userId,
        generated_at: new Date().toISOString(),
        calculated_at: new Date().toISOString(),
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
  } catch (err: any) {
    console.error('Error saving GST summary:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save GST summary' }, { status: 500 });
  }
}
