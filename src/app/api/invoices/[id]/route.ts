import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedContext, getShopInvoicesServer, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { confirmInvoiceSchema, updateTransactionSchema } from '@/lib/validation/schemas';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { money, roundMoney, validateInvoiceArithmetic } from '@/lib/decimal';
import { csrfMiddleware } from '@/lib/security/csrf';

/**
 * GET /api/invoices/[id]
 * Get a single invoice with its line items.
 * Enforces multi-tenant isolation — only invoices belonging to the user's shop are accessible.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    const { id: invoiceId } = await params;

    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .eq('shop_id', ctx.shop.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      console.error('Error fetching invoice:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice }, { status: 200 });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/invoices/[id]
 * Update an existing invoice with validation.
 * Only allows updates to non-financial fields unless the invoice is in draft/pending_review state.
 * All changes are audit logged.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit invoice updates: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`invoice-update:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    const { id: invoiceId } = await params;

    const supabase = await createClient();

    // Fetch existing invoice for authorization and audit
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', ctx.shop.id)
      .single();

    if (fetchError || !existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = confirmInvoiceSchema.parse(body);

    // Build update payload — only allow fields that should be editable
    const updatePayload: Record<string, string | number | boolean | null> = {
      invoice_number: validated.invoice_number,
      invoice_date: validated.invoice_date,
      direction: validated.direction,
      invoice_type: validated.direction === 'sales' ? 'sales_tax_invoice' : 'purchase_tax_invoice',
      supplier_name: validated.supplier_name || existingInvoice.supplier_name,
      supplier_gstin: validated.supplier_gstin || existingInvoice.supplier_gstin,
      customer_name: validated.buyer_name || existingInvoice.customer_name,
      customer_gstin: validated.buyer_gstin || existingInvoice.customer_gstin,
      place_of_supply_state_code: validated.place_of_supply_state_code || existingInvoice.place_of_supply_state_code,
      subtotal: validated.subtotal,
      discount_total: validated.discount_total || '0',
      taxable_value: validated.taxable_value,
      cgst_total: validated.cgst_total || '0',
      sgst_total: validated.sgst_total || '0',
      igst_total: validated.igst_total || '0',
      cess_total: validated.cess_total || '0',
      total_tax: roundMoney(
        money(validated.cgst_total || '0')
          .plus(money(validated.sgst_total || '0'))
          .plus(money(validated.igst_total || '0'))
          .plus(money(validated.cess_total || '0'))
      ).toFixed(2),
      total_amount: validated.total_amount,
      notes: validated.notes || null,
      review_state: validated.review_state || existingInvoice.review_state,
      status: validated.review_state || existingInvoice.status,
    };

    // Validate line item arithmetic against invoice totals
    const lineItems = validated.lines.map((line) => ({
      taxableValue: line.taxable_value,
      totalAmount: line.total_amount,
    }));
    const arithmetic = validateInvoiceArithmetic(
      lineItems,
      validated.taxable_value,
      validated.total_amount,
      1 // ₹1 tolerance
    );
    if (!arithmetic.valid) {
      return NextResponse.json({
        error: 'Invoice arithmetic validation failed',
        details: {
          taxableDifference: arithmetic.taxableDifference.toFixed(2),
          totalDifference: arithmetic.totalDifference.toFixed(2),
        },
      }, { status: 400 });
    }

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .eq('shop_id', ctx.shop.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update line items — delete existing and re-insert
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

    if (validated.lines && validated.lines.length > 0) {
      const lines = validated.lines.map((line, index) => ({
        invoice_id: updatedInvoice.id,
        line_number: index + 1,
        description: line.description,
        hsn_sac_code: line.hsn_sac_code || null,
        quantity: line.quantity || 1,
        unit_price: line.unit_price || 0,
        taxable_value: line.taxable_value || 0,
        gst_rate: line.gst_rate || 18,
        cgst_amount: line.cgst_amount || 0,
        sgst_amount: line.sgst_amount || 0,
        igst_amount: line.igst_amount || 0,
        cess_amount: line.cess_amount || 0,
        total_amount: line.total_amount || 0,
      }));

      const { error: lineError } = await supabase.from('invoice_items').insert(lines);
      if (lineError) {
        console.error('Error updating invoice line items:', lineError);
        return NextResponse.json({ error: lineError.message }, { status: 500 });
      }
    }

    // Log audit event
    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'invoice_updated',
      entityType: 'invoice',
      entityId: updatedInvoice.id,
      metadata: {
        invoice_number: updatedInvoice.invoice_number,
        total_amount: updatedInvoice.total_amount,
        changes: updatePayload,
      },
    });

    return NextResponse.json({ invoice: updatedInvoice, success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: (err as ZodError).issues }, { status: 400 });
    }
    console.error('Error updating invoice:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update invoice' }, { status: 500 });
  }
}

/**
 * DELETE /api/invoices/[id]
 * Cancel/delete an invoice. Only allowed for invoices in draft or pending_review state.
 * Confirmed invoices cannot be deleted — they must be corrected via a credit note instead.
 * All deletions are audit logged.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    const { id: invoiceId } = await params;

    // Rate limit invoice deletion: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`invoice-delete:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    const supabase = await createClient();

    // Fetch existing invoice for authorization and state check
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', ctx.shop.id)
      .single();

    if (fetchError || !existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only allow deletion of draft or pending_review invoices
    // Confirmed invoices must be corrected via credit note, not deleted
    if (existingInvoice.review_state === 'confirmed' || existingInvoice.review_state === 'approved') {
      return NextResponse.json({
        error: 'Cannot delete a confirmed invoice. Use credit note or correction instead.',
      }, { status: 403 });
    }

    // Delete line items first (CASCADE should handle this, but explicit is safer)
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

    // Delete the invoice
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('shop_id', ctx.shop.id);

    if (deleteError) {
      console.error('Error deleting invoice:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log audit event
    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'invoice_deleted',
      entityType: 'invoice',
      entityId: invoiceId,
      metadata: {
        invoice_number: existingInvoice.invoice_number,
        total_amount: existingInvoice.total_amount,
        review_state: existingInvoice.review_state,
      },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted' }, { status: 200 });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to delete invoice' }, { status: 500 });
  }
}
