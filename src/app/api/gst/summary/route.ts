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
        return NextResponse.json({ summary, isDemo: true, shop: DEMO_SHOP });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const invoices = await getShopInvoicesServer(ctx.shop.id);
    const summary = generateGSTPeriodSummary(ctx.shop.id, year, month, invoices as any);

    return NextResponse.json({ summary, isDemo: false, shop: ctx.shop });
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
    const { year, month, summary } = body;

    const supabase = await createClient();
    const periodStr = `${String(month).padStart(2, '0')}${year}`;

    const { data, error } = await supabase
      .from('gst_summaries')
      .insert({
        shop_id: ctx.shop.id,
        financial_year: `${year}-${year + 1}`,
        tax_period: periodStr,
        summary_type: 'monthly',
        status: 'draft',
        calculation_version: '1.0.0',
        outward_taxable_value: parseFloat(summary.gstr1.totalTaxableValue),
        outward_igst: parseFloat(summary.gstr3b.outward_supplies.igst),
        outward_cgst: parseFloat(summary.gstr3b.outward_supplies.cgst),
        outward_sgst: parseFloat(summary.gstr3b.outward_supplies.sgst),
        outward_cess: parseFloat(summary.gstr3b.outward_supplies.cess),
        inward_taxable_value: 0,
        itc_igst: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.igst),
        itc_cgst: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.cgst),
        itc_sgst: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.sgst),
        itc_cess: parseFloat(summary.gstr3b.eligible_itc.net_itc_available.cess),
        net_tax_liability: parseFloat(summary.netTaxPayable.total),
        return_data: summary,
      } as any)
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
