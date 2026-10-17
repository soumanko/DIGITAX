import { createClient } from './client';
import type { Database, DbShop, DbInvoice, DbTransaction, DbReconciliationMatch, DbGstSummary, DbDocument } from '@/types/database';
import { Invoice, Transaction } from '@/types';

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

export async function createShop(shop: {
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
    } as any)
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

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoice,
      shop_id: shopId,
      review_state: invoice.review_state || 'pending_review',
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error inserting invoice:', error);
    throw error;
  }

  // Insert line items if present
  if (items && items.length > 0 && data) {
    const linesToInsert = items.map((item, idx) => ({
      invoice_id: data.id,
      line_number: idx + 1,
      description: item.description,
      hsn_sac_code: item.hsn_sac_code || null,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      taxable_value: item.taxable_value || 0,
      gst_rate: item.gst_rate || 18,
      total_amount: item.total_amount || 0,
    }));

    await supabase.from('invoice_items').insert(linesToInsert as any);
  }

  await logAuditEvent({
    shop_id: shopId,
    action: 'invoice_created',
    entity_type: 'invoice',
    entity_id: data.id,
    metadata: { invoice_number: data.invoice_number, total: data.total_amount },
  });

  return data as DbInvoice;
}

export async function updateInvoiceReviewState(
  invoiceId: string,
  reviewState: 'confirmed' | 'corrected' | 'rejected'
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('invoices')
    .update({ review_state: reviewState, status: reviewState } as any)
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
    } as any)
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
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating reconciliation match:', error);
    throw error;
  }

  // Update status on transaction
  await supabase
    .from('transactions')
    .update({ reconciliation_status: 'matched' } as any)
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
    } as any)
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
    } as any);
  } catch (err) {
    console.warn('Audit logging bypassed:', err);
  }
}
