/**
 * DIGITAX — GNANI EVON V3.3 AI Tool Framework
 *
 * Secure server-side tool architecture for GNANI AI assistant.
 * All tools are allowlisted, validated with Zod, and enforce
 * authentication, shop membership, and permissions.
 *
 * Live GNANI EVON V3.3 API integration: NOT VERIFIED (requires GNANI_EVON_API_KEY)
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { money, roundMoney } from '@/lib/decimal';
import { validateGSTIN } from '@/lib/gst/calculator';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { getShopInvoicesServer } from '@/lib/supabase/server-db';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// Tool Result Types
// ============================================================================

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ToolContext {
  userId: string;
  shopId: string;
  shopName: string;
  userRole: string;
}

// ============================================================================
// Base Tool Interface
// ============================================================================

export interface BaseTool<TArgs = any, TResult = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TArgs>;
  requiresConfirmation: boolean;
  execute: (args: TArgs, ctx: ToolContext) => Promise<ToolResult<TResult>>;
}

// ============================================================================
// Tool Registry
// ============================================================================

const toolRegistry = new Map<string, BaseTool>();

export function registerTool(tool: BaseTool) {
  toolRegistry.set(tool.name, tool);
}

export function getTool(name: string): BaseTool | undefined {
  return toolRegistry.get(name);
}

export function listTools(): string[] {
  return Array.from(toolRegistry.keys());
}

// ============================================================================
// Authentication & Authorization Helpers
// ============================================================================

async function getToolContext(requestHeaders: Headers): Promise<ToolContext | { error: string }> {
  const ctx = await getAuthenticatedContext();
  if (!ctx.userId || !ctx.shop) {
    return { error: 'Authentication and active shop required' };
  }

  return {
    userId: ctx.userId,
    shopId: ctx.shop.id,
    shopName: ctx.shop.name || 'Unknown Shop',
    userRole: ctx.userRole || 'member',
  };
}

// ============================================================================
// Tool: get_invoice_summary
// ============================================================================

const getInvoiceSummarySchema = z.object({
  periodMonth: z.number().min(1).max(12).optional(),
  periodYear: z.number().min(2000).max(2100).optional(),
});

registerTool({
  name: 'get_invoice_summary',
  description: 'Get invoice summary statistics for the active shop, optionally filtered by period.',
  inputSchema: getInvoiceSummarySchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    let query = supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, tax_amount, payment_status, invoice_type, created_at')
      .eq('shop_id', ctx.shopId);

    if (args.periodMonth && args.periodYear) {
      const start = new Date(args.periodYear, args.periodMonth - 1, 1).toISOString();
      const end = new Date(args.periodYear, args.periodMonth, 0).toISOString();
      query = query.gte('created_at', start).lte('created_at', end);
    }

    const { data: invoices, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const list = invoices || [];
    const totalAmount = list.reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));
    const paidAmount = list
      .filter((inv: any) => inv.payment_status === 'paid')
      .reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));
    const outstandingAmount = totalAmount.minus(paidAmount);

    return {
      success: true,
      data: {
        shopId: ctx.shopId,
        shopName: ctx.shopName,
        period: args.periodYear && args.periodMonth ? `${args.periodYear}-${String(args.periodMonth).padStart(2, '0')}` : 'all_time',
        totalInvoices: list.length,
        totalAmount: totalAmount.toString(),
        paidAmount: paidAmount.toString(),
        outstandingAmount: outstandingAmount.toString(),
        byPaymentStatus: list.reduce((acc: Record<string, number>, inv: any) => {
          acc[inv.payment_status || 'unknown'] = (acc[inv.payment_status || 'unknown'] || 0) + 1;
          return acc;
        }, {}),
        byType: list.reduce((acc: Record<string, number>, inv: any) => {
          acc[inv.invoice_type || 'unknown'] = (acc[inv.invoice_type || 'unknown'] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  },
});

// ============================================================================
// Tool: get_invoice_details
// ============================================================================

const getInvoiceDetailsSchema = z.object({
  invoiceId: z.string().uuid(),
});

registerTool({
  name: 'get_invoice_details',
  description: 'Get detailed information about a specific invoice including line items.',
  inputSchema: getInvoiceDetailsSchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', args.invoiceId)
      .eq('shop_id', ctx.shopId)
      .single();

    if (error || !invoice) {
      return { success: false, error: 'Invoice not found or access denied' };
    }

    return {
      success: true,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoiceType: invoice.invoice_type,
        customerGstin: invoice.customer_gstin,
        customerName: invoice.customer_name,
        customerTradeName: invoice.customer_trade_name,
        invoiceDate: invoice.invoice_date,
        placeOfSupply: invoice.place_of_supply,
        taxableValue: invoice.taxable_value,
        cgstTotal: invoice.cgst_total,
        sgstTotal: invoice.sgst_total,
        igstTotal: invoice.igst_total,
        cessTotal: invoice.cess_total,
        totalAmount: invoice.total_amount,
        paymentStatus: invoice.payment_status,
        reviewState: invoice.review_state,
        lineItems: (invoice.invoice_items || []).map((item: any) => ({
          id: item.id,
          lineNumber: item.line_number,
          description: item.description,
          hsnSac: item.hsn_sac,
          quantity: item.quantity,
          unit: item.unit,
          taxableValue: item.taxable_value,
          gstRate: item.gst_rate,
          igstAmount: item.igst_amount,
          cgstAmount: item.cgst_amount,
          sgstAmount: item.sgst_amount,
          totalAmount: item.total_amount,
        })),
      },
    };
  },
});

// ============================================================================
// Tool: search_invoices
// ============================================================================

const searchInvoicesSchema = z.object({
  query: z.string().optional(),
  customerName: z.string().optional(),
  gstin: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  invoiceStatus: z.string().optional(),
  paymentStatus: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

registerTool({
  name: 'search_invoices',
  description: 'Search invoices with filters. Results are bounded and shop-scoped.',
  inputSchema: searchInvoicesSchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    let query = supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, customer_gstin, invoice_type, total_amount, payment_status, invoice_date, created_at', { count: 'exact' })
      .eq('shop_id', ctx.shopId)
      .order('created_at', { ascending: false })
      .range(args.offset, args.offset + args.limit - 1);

    if (args.query) {
      query = query.ilike('invoice_number', `%${args.query}%`);
    }
    if (args.customerName) {
      query = query.ilike('customer_name', `%${args.customerName}%`);
    }
    if (args.gstin) {
      query = query.eq('customer_gstin', args.gstin);
    }
    if (args.dateFrom) {
      query = query.gte('invoice_date', args.dateFrom);
    }
    if (args.dateTo) {
      query = query.lte('invoice_date', args.dateTo);
    }
    if (args.paymentStatus) {
      query = query.eq('payment_status', args.paymentStatus);
    }
    if (args.minAmount) {
      query = query.gte('total_amount', args.minAmount);
    }
    if (args.maxAmount) {
      query = query.lte('total_amount', args.maxAmount);
    }

    const { data: invoices, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        invoices: invoices || [],
        total: count || 0,
        limit: args.limit,
        offset: args.offset,
        hasMore: (count || 0) > args.offset + (invoices || []).length,
        shopId: ctx.shopId,
      },
    };
  },
});

// ============================================================================
// Tool: get_transaction_summary
// ============================================================================

const getTransactionSummarySchema = z.object({
  periodMonth: z.number().min(1).max(12).optional(),
  periodYear: z.number().min(2000).max(2100).optional(),
});

registerTool({
  name: 'get_transaction_summary',
  description: 'Get bank transaction summary statistics for the active shop.',
  inputSchema: getTransactionSummarySchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select('id, amount, transaction_type, status, reconciliation_status, transaction_date')
      .eq('shop_id', ctx.shopId);

    if (args.periodMonth && args.periodYear) {
      const start = new Date(args.periodYear, args.periodMonth - 1, 1).toISOString();
      const end = new Date(args.periodYear, args.periodMonth, 0).toISOString();
      query = query.gte('transaction_date', start).lte('transaction_date', end);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const list = transactions || [];
    const totalCredits = list
      .filter((t: any) => t.transaction_type === 'credit')
      .reduce((acc, t) => acc.plus(money(t.amount || '0')), money(0));
    const totalDebits = list
      .filter((t: any) => t.transaction_type === 'debit')
      .reduce((acc, t) => acc.plus(money(t.amount || '0')), money(0));
    const matched = list.filter((t: any) => t.reconciliation_status === 'matched').length;
    const unmatched = list.filter((t: any) => t.reconciliation_status !== 'matched').length;

    return {
      success: true,
      data: {
        shopId: ctx.shopId,
        period: args.periodYear && args.periodMonth ? `${args.periodYear}-${String(args.periodMonth).padStart(2, '0')}` : 'all_time',
        totalTransactions: list.length,
        totalCredits: totalCredits.toString(),
        totalDebits: totalDebits.toString(),
        netAmount: totalCredits.minus(totalDebits).toString(),
        matchedCount: matched,
        unmatchedCount: unmatched,
      },
    };
  },
});

// ============================================================================
// Tool: search_transactions
// ============================================================================

const searchTransactionsSchema = z.object({
  query: z.string().optional(),
  transactionType: z.string().optional(),
  status: z.string().optional(),
  reconciliationStatus: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

registerTool({
  name: 'search_transactions',
  description: 'Search bank transactions with filters. Results are bounded and shop-scoped.',
  inputSchema: searchTransactionsSchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select('id, reference, amount, transaction_type, status, reconciliation_status, transaction_date, description', { count: 'exact' })
      .eq('shop_id', ctx.shopId)
      .order('transaction_date', { ascending: false })
      .range(args.offset, args.offset + args.limit - 1);

    if (args.query) {
      query = query.ilike('reference', `%${args.query}%`);
    }
    if (args.transactionType) {
      query = query.eq('transaction_type', args.transactionType);
    }
    if (args.status) {
      query = query.eq('status', args.status);
    }
    if (args.reconciliationStatus) {
      query = query.eq('reconciliation_status', args.reconciliationStatus);
    }
    if (args.dateFrom) {
      query = query.gte('transaction_date', args.dateFrom);
    }
    if (args.dateTo) {
      query = query.lte('transaction_date', args.dateTo);
    }
    if (args.minAmount) {
      query = query.gte('amount', args.minAmount);
    }
    if (args.maxAmount) {
      query = query.lte('amount', args.maxAmount);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        transactions: transactions || [],
        total: count || 0,
        limit: args.limit,
        offset: args.offset,
        hasMore: (count || 0) > args.offset + (transactions || []).length,
        shopId: ctx.shopId,
      },
    };
  },
});

// ============================================================================
// Tool: get_gst_summary
// ============================================================================

const getGSTSummarySchema = z.object({
  year: z.number().min(2000).max(2100).default(2026),
  month: z.number().min(1).max(12).default(10),
});

registerTool({
  name: 'get_gst_summary',
  description: 'Get GST period summary (GSTR-1 outward supplies, GSTR-3B inward ITC, net tax payable).',
  inputSchema: getGSTSummarySchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', ctx.shopId);

    if (!invoices) {
      return { success: false, error: 'Failed to fetch invoices for GST summary' };
    }

    try {
      const summary = generateGSTPeriodSummary(ctx.shopId, args.year, args.month, invoices as any[]);

      return {
        success: true,
        data: {
          shopId: ctx.shopId,
          shopName: ctx.shopName,
          period: `${args.year}-${String(args.month).padStart(2, '0')}`,
          gstr1: summary.gstr1,
          gstr3b: summary.gstr3b,
          netTaxPayable: summary.netTaxPayable,
          calculationVersion: summary.calculationVersion || '1.0',
          rulesetVersion: summary.rulesetVersion || '1.0',
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'GST calculation failed',
      };
    }
  },
});

// ============================================================================
// Tool: get_reconciliation_status
// ============================================================================

const getReconciliationStatusSchema = z.object({});

registerTool({
  name: 'get_reconciliation_status',
  description: 'Get reconciliation statistics for the active shop.',
  inputSchema: getReconciliationStatusSchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, reconciliation_status, amount')
      .eq('shop_id', ctx.shopId);

    if (error) {
      return { success: false, error: error.message };
    }

    const list = transactions || [];
    const matched = list.filter((t: any) => t.reconciliation_status === 'matched');
    const unmatched = list.filter((t: any) => t.reconciliation_status !== 'matched');
    const matchedAmount = matched.reduce((acc, t) => acc.plus(money(t.amount || '0')), money(0));
    const unmatchedAmount = unmatched.reduce((acc, t) => acc.plus(money(t.amount || '0')), money(0));

    return {
      success: true,
      data: {
        shopId: ctx.shopId,
        totalTransactions: list.length,
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
        matchedAmount: matchedAmount.toString(),
        unmatchedAmount: unmatchedAmount.toString(),
        reconciliationRate: list.length > 0 ? roundMoney(money(matched.length / list.length * 100)).toString() : '0',
      },
    };
  },
});

// ============================================================================
// Tool: search_documents
// ============================================================================

const searchDocumentsSchema = z.object({
  query: z.string().optional(),
  documentType: z.string().optional(),
  processingStatus: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

registerTool({
  name: 'search_documents',
  description: 'Search documents with filters. Results are bounded and shop-scoped.',
  inputSchema: searchDocumentsSchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    let query = supabase
      .from('documents')
      .select('id, original_filename, document_type, processing_status, file_size, created_at', { count: 'exact' })
      .eq('shop_id', ctx.shopId)
      .order('created_at', { ascending: false })
      .range(args.offset, args.offset + args.limit - 1);

    if (args.query) {
      query = query.ilike('original_filename', `%${args.query}%`);
    }
    if (args.documentType) {
      query = query.eq('document_type', args.documentType);
    }
    if (args.processingStatus) {
      query = query.eq('processing_status', args.processingStatus);
    }

    const { data: documents, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        documents: documents || [],
        total: count || 0,
        limit: args.limit,
        offset: args.offset,
        hasMore: (count || 0) > args.offset + (documents || []).length,
        shopId: ctx.shopId,
      },
    };
  },
});

// ============================================================================
// Tool: get_business_metrics
// ============================================================================

const getBusinessMetricsSchema = z.object({
  periodMonth: z.number().min(1).max(12).optional(),
  periodYear: z.number().min(2000).max(2100).optional(),
});

registerTool({
  name: 'get_business_metrics',
  description: 'Get comprehensive business metrics for the active shop including sales, purchases, GST liability, and reconciliation.',
  inputSchema: getBusinessMetricsSchema,
  requiresConfirmation: false,
  execute: async (args, ctx) => {
    const supabase = await createClient();

    let invoiceQuery = supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', ctx.shopId);

    if (args.periodMonth && args.periodYear) {
      const start = new Date(args.periodYear, args.periodMonth - 1, 1).toISOString();
      const end = new Date(args.periodYear, args.periodMonth, 0).toISOString();
      invoiceQuery = invoiceQuery.gte('created_at', start).lte('created_at', end);
    }

    const [invResult, txnResult] = await Promise.all([
      invoiceQuery,
      supabase.from('transactions').select('*').eq('shop_id', ctx.shopId),
    ]);

    const invoices = invResult.data || [];
    const transactions = txnResult.data || [];

    const totalSales = invoices
      .filter((i: any) => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
      .reduce((acc, i) => acc.plus(money(i.total_amount || '0')), money(0));
    const totalPurchases = invoices
      .filter((i: any) => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
      .reduce((acc, i) => acc.plus(money(i.total_amount || '0')), money(0));
    const totalITC = invoices
      .filter((i: any) => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
      .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));
    const totalOutputTax = invoices
      .filter((i: any) => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
      .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));
    const netTaxPayable = totalOutputTax.minus(totalITC).isNegative() ? money(0) : totalOutputTax.minus(totalITC);

    const paidInvoices = invoices.filter((i: any) => i.payment_status === 'paid').length;
    const unpaidInvoices = invoices.filter((i: any) => i.payment_status !== 'paid').length;
    const pendingReview = invoices.filter((i: any) => i.review_state === 'pending_review').length;
    const unmatchedTxns = transactions.filter((t: any) => t.reconciliation_status !== 'matched').length;

    return {
      success: true,
      data: {
        shopId: ctx.shopId,
        shopName: ctx.shopName,
        period: args.periodYear && args.periodMonth ? `${args.periodYear}-${String(args.periodMonth).padStart(2, '0')}` : 'all_time',
        totalSales: totalSales.toString(),
        totalPurchases: totalPurchases.toString(),
        totalITC: totalITC.toString(),
        totalOutputTax: totalOutputTax.toString(),
        netTaxPayable: netTaxPayable.toString(),
        paidInvoices,
        unpaidInvoices,
        outstandingAmount: totalSales.minus(
          invoices
            .filter((i: any) => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
            .filter((i: any) => i.payment_status === 'paid')
            .reduce((acc, i) => acc.plus(money(i.total_amount || '0')), money(0))
        ).toString(),
        pendingReviewCount: pendingReview,
        unmatchedTransactionCount: unmatchedTxns,
      },
    };
  },
});

// ============================================================================
// Tool Execution Orchestration
// ============================================================================

/**
 * Parses and executes a GNANI tool call request.
 * Validates the tool name against the allowlist, validates arguments,
 * verifies authentication and shop membership, then executes.
 *
 * @param toolName - The name of the tool to execute
 * @param rawArgs - Raw arguments from the AI (may be JSON string or object)
 * @param requestHeaders - Request headers for authentication context
 * @returns Tool execution result
 */
export async function executeGnaniTool(
  toolName: string,
  rawArgs: any,
  requestHeaders: Headers
): Promise<ToolResult> {
  // 1. Validate tool is in allowlist
  const tool = getTool(toolName);
  if (!tool) {
    return {
      success: false,
      error: `Unknown or disallowed tool: ${toolName}. Available tools: ${listTools().join(', ')}`,
    };
  }

  // 2. Get authenticated context
  const ctxResult = await getToolContext(requestHeaders);
  if ('error' in ctxResult) {
    return { success: false, error: ctxResult.error };
  }
  const ctx: ToolContext = ctxResult;

  // 3. Parse and validate arguments
  let args: any;
  if (typeof rawArgs === 'string') {
    try {
      args = JSON.parse(rawArgs);
    } catch {
      return { success: false, error: 'Invalid tool arguments: could not parse JSON' };
    }
  } else {
    args = rawArgs;
  }

  const validatedArgs = tool.inputSchema.safeParse(args);
  if (!validatedArgs.success) {
    return {
      success: false,
      error: 'Invalid tool arguments',
      metadata: { issues: validatedArgs.error.issues },
    };
  }

  // 4. Execute the tool
  try {
    const result = await tool.execute(validatedArgs.data, ctx);
    return result;
  } catch (err) {
    console.error(`GNANI tool ${toolName} execution error:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Tool execution failed',
    };
  }
}
