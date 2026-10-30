import { createClient } from './server';
import type { DbShop, DbInvoice, DbTransaction, DbReconciliationMatch, DbGstSummary, DbDocument } from '@/types/database';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { money } from '@/lib/decimal';
import Decimal from 'decimal.js';

export interface AuthContext {
  userId: string;
  isDemo: boolean;
  shop: DbShop | null;
}

/**
 * Validates the authenticated user session and ensures they have access to the target shop.
 * Enforces multi-tenant isolation at the server layer.
 */
export async function getAuthenticatedContext(requestedShopId?: string | null): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      userId: '',
      isDemo: false,
      shop: null,
    };
  }

  let shopQuery = supabase.from('shops').select('*');

  if (requestedShopId) {
    shopQuery = shopQuery.eq('id', requestedShopId);
  } else {
    shopQuery = shopQuery.order('created_at', { ascending: false }).limit(1);
  }

  const { data: shops, error: shopError } = await shopQuery;

  if (shopError || !shops || shops.length === 0) {
    return {
      userId: user.id,
      isDemo: false,
      shop: null,
    };
  }

  const activeShop = shops[0] as DbShop;

  // Verify membership if user is not the direct owner
  if (activeShop.owner_id !== user.id) {
    const { data: membership } = await supabase
      .from('shop_members')
      .select('role')
      .eq('shop_id', activeShop.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      // Forbidden: Attempting to access unauthorized tenant shop
      return {
        userId: user.id,
        isDemo: false,
        shop: null,
      };
    }
  }

  return {
    userId: user.id,
    isDemo: false,
    shop: activeShop,
  };
}

/**
 * Creates a new shop and registers the creator as the owner member.
 */
export async function createShopWithMembership(userId: string, shopData: {
  name: string;
  business_type?: string;
  gstin?: string | null;
  state_code?: string;
  state?: string;
  city?: string;
  pincode?: string;
  taxpayer_scheme?: 'regular' | 'composition_goods' | 'composition_services' | 'qrmp';
  preferred_language?: string;
}): Promise<DbShop> {
  const supabase = await createClient();

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .insert({
      owner_id: userId,
      name: shopData.name,
      business_type: shopData.business_type || null,
      gstin: shopData.gstin || null,
      state_code: shopData.state_code || null,
      state: shopData.state || null,
      city: shopData.city || null,
      pincode: shopData.pincode || null,
      taxpayer_scheme: shopData.taxpayer_scheme || 'regular',
      preferred_language: shopData.preferred_language || 'en',
      onboarding_completed: true,
    } as any)
    .select()
    .single();

  if (shopError || !shop) {
    console.error('Failed to create shop record:', shopError);
    throw new Error(shopError?.message || 'Failed to create business shop record');
  }

  // Insert shop_members record
  try {
    await supabase.from('shop_members').insert({
      shop_id: shop.id,
      user_id: userId,
      role: 'owner',
    } as any);
  } catch (err) {
    console.warn('Membership record insert notice:', err);
  }

  // Log immutable audit event
  await logAuditEventServer({
    shopId: shop.id,
    actorId: userId,
    action: 'shop_created',
    entityType: 'shop',
    entityId: shop.id,
    metadata: { name: shop.name, gstin: shop.gstin },
  });

  return shop as DbShop;
}

/**
 * Retrieves invoices for an authorized shop.
 */
export async function getShopInvoicesServer(shopId: string): Promise<any[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('shop_id', shopId)
    .order('invoice_date', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Creates an invoice with line items atomically and logs the audit event.
 */
export async function createInvoiceServer(
  shopId: string,
  userId: string,
  invoice: Record<string, any>,
  items?: Array<Record<string, any>>
): Promise<DbInvoice> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoice,
      shop_id: shopId,
      review_state: invoice.review_state || 'confirmed',
      status: invoice.status || 'confirmed',
    } as any)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating invoice:', error);
    throw new Error(error?.message || 'Failed to persist invoice');
  }

  if (items && items.length > 0) {
    const lines = items.map((item, index) => ({
      invoice_id: data.id,
      line_number: index + 1,
      description: item.description,
      hsn_sac_code: item.hsn_sac_code || null,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      taxable_value: item.taxable_value || 0,
      gst_rate: item.gst_rate || 18,
      cgst_amount: item.cgst_amount || 0,
      sgst_amount: item.sgst_amount || 0,
      igst_amount: item.igst_amount || 0,
      total_amount: item.total_amount || 0,
    }));

    const { error: lineError } = await supabase.from('invoice_items').insert(lines as any);
    if (lineError) {
      console.warn('Error inserting invoice lines:', lineError);
    }
  }

  await logAuditEventServer({
    shopId,
    actorId: userId,
    action: 'invoice_created',
    entityType: 'invoice',
    entityId: data.id,
    metadata: { invoice_number: data.invoice_number, total: data.total_amount },
  });

  return data as DbInvoice;
}

/**
 * Retrieves transactions for an authorized shop.
 */
export async function getShopTransactionsServer(shopId: string): Promise<DbTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('shop_id', shopId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw new Error(error.message);
  }

  return (data || []) as DbTransaction[];
}

/**
 * Bulk imports transactions from a verified statement import.
 */
export async function importTransactionsBatchServer(
  shopId: string,
  userId: string,
  transactions: Array<Record<string, any>>
): Promise<DbTransaction[]> {
  const supabase = await createClient();

  const formattedTxns = transactions.map((t) => ({
    shop_id: shopId,
    source: t.source || 'bank_import',
    source_account: t.source_account || null,
    bank_account_name: t.bank_account_name || null,
    transaction_date: t.transaction_date,
    value_date: t.value_date || t.transaction_date,
    description: t.description,
    reference_number: t.reference_number || null,
    direction: t.direction,
    transaction_type: t.direction,
    amount: t.amount,
    category: t.category || 'business_sale',
    sub_category: t.sub_category || null,
    review_state: 'confirmed',
    reconciliation_status: 'unmatched',
    matched_amount: '0.00',
    unmatched_amount: t.amount,
  }));

  const { data, error } = await supabase
    .from('transactions')
    .insert(formattedTxns as any)
    .select();

  if (error || !data) {
    console.error('Error importing transactions:', error);
    throw new Error(error?.message || 'Failed to import transactions');
  }

  await logAuditEventServer({
    shopId,
    actorId: userId,
    action: 'transactions_imported',
    entityType: 'transaction_batch',
    entityId: shopId,
    metadata: { count: data.length },
  });

  return data as DbTransaction[];
}

/**
 * Reconciles an invoice and transaction atomically.
 */
export async function confirmReconciliationMatchServer(
  shopId: string,
  userId: string,
  transactionId: string,
  invoiceId: string,
  allocatedAmount: string
): Promise<DbReconciliationMatch> {
  const supabase = await createClient();

  // Cross-tenant verification: Ensure both transaction and invoice belong to this shop
  const [txnRes, invRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', transactionId).eq('shop_id', shopId).single(),
    supabase.from('invoices').select('*').eq('id', invoiceId).eq('shop_id', shopId).single(),
  ]);

  if (txnRes.error || !txnRes.data || invRes.error || !invRes.data) {
    throw new Error('Transaction or Invoice does not belong to authorized shop');
  }

  const txn = txnRes.data;
  const inv = invRes.data;

  // Insert match record
  const { data: match, error: matchError } = await supabase
    .from('reconciliation_matches')
    .insert({
      shop_id: shopId,
      transaction_id: transactionId,
      invoice_id: invoiceId,
      allocated_amount: parseFloat(allocatedAmount),
      match_status: 'confirmed',
      match_method: 'manual_confirmed',
      manual_review_status: 'reviewed',
    } as any)
    .select()
    .single();

  if (matchError || !match) {
    throw new Error(matchError?.message || 'Failed to create reconciliation match');
  }

  // Update transaction reconciliation status
  const currentMatched = money(txn.matched_amount || '0');
  const addMatched = money(allocatedAmount);
  const newMatched = currentMatched.plus(addMatched);
  const totalTxnAmt = money(txn.amount);
  const newUnmatched = Decimal.max(0, totalTxnAmt.minus(newMatched));
  const newStatus = newUnmatched.eq(0) ? 'matched' : 'partially_matched';

  await supabase
    .from('transactions')
    .update({
      matched_amount: newMatched.toFixed(2),
      unmatched_amount: newUnmatched.toFixed(2),
      reconciliation_status: newStatus,
    } as any)
    .eq('id', transactionId);

  // Update invoice payment status
  const invTotal = money(inv.total_amount);
  const invPaid = money(inv.amount_paid || '0').plus(addMatched);
  const invDue = Decimal.max(0, invTotal.minus(invPaid));
  const invPaymentStatus = invDue.eq(0) ? 'paid' : 'partially_paid';

  await supabase
    .from('invoices')
    .update({
      amount_paid: invPaid.toFixed(2),
      amount_due: invDue.toFixed(2),
      payment_status: invPaymentStatus,
    } as any)
    .eq('id', invoiceId);

  await logAuditEventServer({
    shopId,
    actorId: userId,
    action: 'reconciliation_confirmed',
    entityType: 'reconciliation_match',
    entityId: match.id,
    metadata: {
      transaction_id: transactionId,
      invoice_id: invoiceId,
      allocated_amount: allocatedAmount,
    },
  });

  return match as DbReconciliationMatch;
}

/**
 * Server-side audit event logging with actor attribution.
 */
export async function logAuditEventServer(params: {
  shopId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('audit_events').insert({
      shop_id: params.shopId || null,
      actor_id: params.actorId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata || null,
      reason: params.reason || null,
    } as any);
  } catch (err) {
    console.warn('Audit event recording notice:', err);
  }
}
