import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopInvoicesServer, createInvoiceServer } from '@/lib/supabase/server-db';
import { confirmInvoiceSchema } from '@/lib/validation/schemas';
import { DEMO_INVOICES } from '@/lib/demo-data';

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

    const invoices = await getShopInvoicesServer(ctx.shop.id);
    return NextResponse.json({ invoices, isDemo: false });
  } catch (err: any) {
    console.error('Error fetching invoices:', err);
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
      total_tax: String(
        parseFloat(validated.cgst_total || '0') +
        parseFloat(validated.sgst_total || '0') +
        parseFloat(validated.igst_total || '0') +
        parseFloat(validated.cess_total || '0')
      ),
      total_amount: validated.total_amount,
      amount_paid: '0.00',
      amount_due: validated.total_amount,
      payment_status: 'unpaid',
      review_state: 'confirmed',
      notes: validated.notes || null,
    };

    const created = await createInvoiceServer(ctx.shop.id, ctx.userId, invoiceRecord, validated.lines);

    return NextResponse.json({ invoice: created, success: true }, { status: 201 });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 });
    }
    console.error('Error creating invoice:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create invoice' }, { status: 500 });
  }
}
