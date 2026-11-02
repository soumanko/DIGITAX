import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedContext, createInvoiceServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { confirmInvoiceSchema } from '@/lib/validation/schemas';
import { DEMO_INVOICES } from '@/lib/demo-data';
import { money, roundMoney } from '@/lib/decimal';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const isDemoCookie = request.cookies.get('digitax_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        return NextResponse.json({ invoices: DEMO_INVOICES, isDemo: true });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = await createClient();

    const { data: invoices, error, count } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)', { count: 'exact' })
      .eq('shop_id', ctx.shop.id)
      .order('invoice_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      invoices: invoices || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (invoices || []).length,
      isDemo: false,
    }, { status: 200 });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit invoice creation: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`invoice-create:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const body = await request.json();
    const validated = confirmInvoiceSchema.parse(body);

    const invoiceRecord = {
      invoice_number: validated.invoice_number,
      invoice_date: validated.invoice_date,
      direction: validated.direction,
      invoice_type: validated.direction === 'sales' ? 'sales_tax_invoice' : 'purchase_tax_invoice',
      supplier_name: validated.supplier_name || ctx.shop.name,
      supplier_gstin: validated.supplier_gstin || ctx.shop.gstin,
      customer_name: validated.buyer_name || null,
      customer_gstin: validated.buyer_gstin || null,
      place_of_supply: validated.place_of_supply_state_code || ctx.shop.state_code,
      subtotal: validated.subtotal,
      discount_amount: validated.discount_total || '0',
      taxable_value: validated.taxable_value,
      cgst_amount: validated.cgst_total || '0',
      sgst_amount: validated.sgst_total || '0',
      igst_amount: validated.igst_total || '0',
      cess_amount: validated.cess_total || '0',
      total_tax: roundMoney(
        money(validated.cgst_total || '0')
          .plus(money(validated.sgst_total || '0'))
          .plus(money(validated.igst_total || '0'))
          .plus(money(validated.cess_total || '0'))
      ).toFixed(2),
      total_amount: validated.total_amount,
      amount_paid: '0.00',
      amount_due: validated.total_amount,
      payment_status: 'unpaid',
      review_state: 'confirmed',
      notes: validated.notes || null,
    };

    const created = await createInvoiceServer(ctx.shop.id, ctx.userId, invoiceRecord, validated.lines);

    return NextResponse.json({ invoice: created, success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: (err as ZodError).issues }, { status: 400 });
    }
    console.error('Error creating invoice:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create invoice' }, { status: 500 });
  }
}
