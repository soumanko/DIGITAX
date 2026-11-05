import { createClient } from './client';
import type { Database, DbShop, DbInvoice, DbTransaction, DbReconciliationMatch, DbGstSummary, DbDocument } from '@/types/database';
import { money } from '@/lib/decimal';

/**
 * DIGITAX Database Service Layer
 * Multi-tenant safe Supabase data access layer enforcing shop isolation and audit logging.
 */

export async function getActiveUserShop(): Promise<DbShop | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch shop where user is owner or member
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as DbShop;
}

export async function createShopWithMembership(shop: {
  name: string;
  business_type?: string;
  gstin?: string;
  state_code?: string;
  state?: string;
  city?: string;
  pincode?: string;
  taxpayer_scheme?: 'regular' | 'composition_goods' | 'composition_services' | 'qrmp';
}): Promise<DbShop | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required to create a shop');

  const { data, error } = await supabase
    .from('shops')
    .insert({
      owner_id: user.id,
      name: shop.name,
      business_type: shop.business_type || null,
      gstin: shop.gstin || null,
      state_code: shop.state_code || null,
      state: shop.state || null,
      city: shop.city || null,
      pincode: shop.pincode || null,
      taxpayer_scheme: shop.taxpayer_scheme || 'regular',
      onboarding_completed: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create shop:', error);
    throw error;
  }

  // Record audit log
  await logAuditEvent({
    shop_id: data.id,
    action: 'shop_created',
    entity_type: 'shop',
    entity_id: data.id,
    metadata: { name: shop.name, gstin: shop.gstin },
  });

  return data as DbShop;
}

export async function getShopInvoices(shopId: string): Promise<DbInvoice[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shopId)
    .order('invoice_date', { ascending: false });

  if (error) {
    console.warn('Could not fetch invoices from Supabase:', error.message);
    return [];
  }
  return (data || []) as DbInvoice[];
}

export async function createInvoiceWithLines(
  shopId: string,
  invoice: Partial<DbInvoice>,
  items?: Array<{
    description: string;
    hsn_sac_code?: string;
    quantity?: number;
    unit_price?: number;
    taxable_value?: number;
    gst_rate?: number;
    total_amount?: number;
  }>
): Promise<DbInvoice | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  const linesPayload = (items || []).map((item, index) => ({
    line_number: index + 1,
    description: item.description,
    hsn_sac_code: item.hsn_sac_code || null,
    quantity: item.quantity || 1,
    unit_price: item.unit_price || 0,
    taxable_value: item.taxable_value || 0,
    gst_rate: item.gst_rate || 18,
    total_amount: item.total_amount || 0,
  }));

  const { data, error } = await supabase.rpc('create_invoice_atomic', {
    p_shop_id: shopId,
    p_user_id: userId,
    p_invoice_number: invoice.invoice_number || '',
    p_invoice_date: invoice.invoice_date,
    p_direction: invoice.direction,
    p_invoice_type: invoice.invoice_type,
    p_supplier_name: invoice.supplier_name || '',
    p_supplier_gstin: invoice.supplier_gstin || null,
    p_customer_name: invoice.customer_legal_name || '',
    p_customer_gstin: invoice.customer_gstin || null,
    p_place_of_supply: invoice.place_of_supply_state_code || null,
    p_subtotal: invoice.subtotal || '0',
    p_discount_amount: invoice.discount_total || '0',
    p_taxable_value: invoice.taxable_value || '0',
    p_cgst_amount: invoice.cgst_total?.toString() || '0',
    p_sgst_amount: invoice.sgst_total?.toString() || '0',
    p_igst_amount: invoice.igst_total?.toString() || '0',
    p_cess_amount: invoice.cess_total?.toString() || '0',
    p_total_tax: money(invoice.cgst_total || 0)
      .plus(money(invoice.sgst_total || 0))
      .plus(money(invoice.igst_total || 0))
      .plus(money(invoice.cess_total || 0))
      .toFixed(2),
    p_total_amount: invoice.total_amount || '0',
    p_amount_paid: invoice.amount_paid || '0',
    p_amount_due: invoice.amount_due || '0',
    p_payment_status: invoice.payment_status || 'unpaid',
    p_review_state: invoice.review_state || 'pending_review',
    p_notes: invoice.notes || null,
    p_items: linesPayload,
  });

  if (error) {
    console.error('Error creating invoice atomically:', error);
    throw error;
  }

  return data as DbInvoice;
}

export async function updateInvoiceReviewState(
  invoiceId: string,
  reviewState: 'confirmed' | 'corrected' | 'rejected'
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('invoices')
    .update({ review_state: reviewState, status: reviewState })
    .eq('id', invoiceId);

  if (error) {
    console.error('Error updating invoice status:', error);
    return false;
  }

  await logAuditEvent({
    action: 'invoice_reviewed',
    entity_type: 'invoice',
    entity_id: invoiceId,
    metadata: { new_state: reviewState },
  });

  return true;
}

export async function getShopTransactions(shopId: string): Promise<DbTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('shop_id', shopId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.warn('Could not fetch transactions from Supabase:', error.message);
    return [];
  }
  return (data || []) as DbTransaction[];
}

export async function createTransaction(
  shopId: string,
  txn: Partial<DbTransaction>
): Promise<DbTransaction | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...txn,
      shop_id: shopId,
      reconciliation_status: txn.reconciliation_status || 'unmatched',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }

  await logAuditEvent({
    shop_id: shopId,
    action: 'transaction_created',
    entity_type: 'transaction',
    entity_id: data.id,
    metadata: { amount: data.amount, direction: data.direction },
  });

  return data as DbTransaction;
}

export async function createReconciliationMatch(
  shopId: string,
  transactionId: string,
  invoiceId: string,
  allocatedAmount: number,
  matchMethod: string = 'manual'
): Promise<DbReconciliationMatch | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('reconciliation_matches')
    .insert({
      shop_id: shopId,
      transaction_id: transactionId,
      invoice_id: invoiceId,
      allocated_amount: allocatedAmount,
      match_status: 'confirmed',
      match_method: matchMethod,
      manual_review_status: 'reviewed',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating reconciliation match:', error);
    throw error;
  }

  // Update status on transaction
  await supabase
    .from('transactions')
    .update({ reconciliation_status: 'matched' })
    .eq('id', transactionId);

  await logAuditEvent({
    shop_id: shopId,
    action: 'reconciliation_matched',
    entity_type: 'reconciliation_match',
    entity_id: data.id,
    metadata: { transaction_id: transactionId, invoice_id: invoiceId, allocatedAmount },
  });

  return data as DbReconciliationMatch;
}

export async function saveGstSummary(
  shopId: string,
  summary: Partial<DbGstSummary>
): Promise<DbGstSummary | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gst_summaries')
    .insert({
      ...summary,
      shop_id: shopId,
      calculation_version: '1.0.0',
      status: summary.status || 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving GST summary:', error);
    throw error;
  }

  await logAuditEvent({
    shop_id: shopId,
    action: 'gst_summary_generated',
    entity_type: 'gst_summary',
    entity_id: data.id,
    metadata: { fy: summary.financial_year, period: summary.tax_period, net: summary.net_tax_liability },
  });

  return data as DbGstSummary;
}

export async function logAuditEvent(event: {
  shop_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_events').insert({
      shop_id: event.shop_id || null,
      actor_id: user.id,
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      metadata: event.metadata || null,
      reason: event.reason || null,
    });
  } catch (err) {
    console.warn('Audit logging bypassed:', err);
  }
}
