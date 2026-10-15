// Core domain types for DIGITAX
// All monetary values use string representation for decimal.js compatibility

// ============================================
// Common
// ============================================

export type ReviewState = 
  | 'pending_review' 
  | 'confirmed' 
  | 'corrected' 
  | 'rejected' 
  | 'needs_clarification';

export type Currency = 'INR';

export type Language = 'en' | 'hi' | 'bn' | 'mr';

// ============================================
// Profiles & Shops
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  preferred_language: Language;
  created_at: string;
  updated_at: string;
}

export type ShopMemberRole = 'owner' | 'admin' | 'member';

export interface Shop {
  id: string;
  name: string;
  business_type: string | null;
  gstin: string | null;
  gst_registration_type: GSTRegistrationType | null;
  taxpayer_scheme: TaxpayerScheme | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  state_code: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  preferred_language: Language;
  financial_year_start_month: number; // 4 for April
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: ShopMemberRole;
  created_at: string;
}

export type GSTRegistrationType = 
  | 'regular'
  | 'composition'
  | 'unregistered'
  | 'input_service_distributor'
  | 'casual_taxable'
  | 'non_resident';

export type TaxpayerScheme =
  | 'regular'
  | 'composition_goods'
  | 'composition_services'
  | 'qrmp'; // Quarterly Return Monthly Payment

// ============================================
// Documents
// ============================================

export type DocumentType = 'sales_invoice' | 'purchase_invoice' | 'credit_note' | 'debit_note' | 'receipt' | 'other';
export type ProcessingStatus = 'uploaded' | 'queued' | 'processing' | 'extracted' | 'failed' | 'manual_entry';

export interface Document {
  id: string;
  shop_id: string;
  storage_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  content_hash: string;
  document_type: DocumentType;
  processing_status: ProcessingStatus;
  extraction_attempts: number;
  last_extraction_error: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Invoices
// ============================================

export type InvoiceDirection = 'sales' | 'purchase';

export interface Invoice {
  id: string;
  shop_id: string;
  document_id: string | null;
  direction: InvoiceDirection;
  invoice_type?: 'purchase_tax_invoice' | 'sales_tax_invoice';
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  supplier_name: string | null;
  supplier_legal_name?: string | null;
  supplier_trade_name?: string | null;
  supplier_address?: string | null;
  supplier_gstin: string | null;
  buyer_name: string | null;
  customer_legal_name?: string | null;
  customer_trade_name?: string | null;
  customer_address?: string | null;
  buyer_gstin: string | null;
  customer_gstin?: string | null;
  place_of_supply_state_code: string | null;
  is_inter_state: boolean | null;
  is_reverse_charge?: boolean;
  subtotal: string; // decimal string
  discount_total: string;
  taxable_value: string;
  cgst_total: string;
  cgst_amount?: string;
  sgst_total: string;
  sgst_amount?: string;
  igst_total: string;
  igst_amount?: string;
  cess_total: string;
  cess_amount?: string;
  total_tax_amount?: string;
  round_off_amount?: string;
  total_amount: string;
  amount_paid: string;
  paid_amount?: string;
  amount_due: string;
  outstanding_balance?: string;
  payment_status?: 'paid' | 'unpaid' | 'partial';
  review_state: ReviewState;
  extraction_confidence: number | null;
  needs_review_reasons?: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  line_number: number;
  item_description?: string;
  description: string;
  hsn_sac_code: string | null;
  quantity: string | null;
  unit: string | null;
  unit_of_measure?: string | null;
  unit_price: string | null;
  discount: string;
  discount_amount?: string;
  taxable_value: string;
  gst_rate: string; // e.g., "18" for 18%
  cgst_rate?: string;
  cgst_amount: string;
  sgst_rate?: string;
  sgst_amount: string;
  igst_rate?: string;
  igst_amount: string;
  cess_rate?: string;
  cess_amount: string;
  total_tax_amount?: string;
  total_amount: string;
  review_state?: ReviewState;
  created_at: string;
}

export type InvoiceLineItem = InvoiceLine;

// ============================================
// Transactions
// ============================================

export type TransactionDirection = 'credit' | 'debit';

export type TransactionCategory =
  | 'business_sale'
  | 'business_purchase'
  | 'supplier_payment'
  | 'customer_receipt'
  | 'refund'
  | 'bank_transfer'
  | 'loan_borrowing'
  | 'owner_contribution'
  | 'owner_withdrawal'
  | 'personal'
  | 'cash_entry'
  | 'unknown'
  | string;

export interface Transaction {
  id: string;
  shop_id: string;
  source?: 'bank_import' | 'upi_qr' | 'manual' | string;
  bank_account_name?: string | null;
  import_batch_id: string | null;
  external_txn_id: string | null;
  transaction_date: string;
  value_date?: string;
  description: string;
  reference_number?: string | null;
  upi_id?: string | null;
  amount: string;
  direction: TransactionDirection;
  transaction_type?: 'credit' | 'debit';
  category: TransactionCategory;
  sub_category?: string;
  source_account: string | null;
  review_state: ReviewState;
  reconciliation_status?: 'matched' | 'unmatched' | 'partial';
  matched_amount?: string;
  unmatched_amount?: string;
  original_row_data: Record<string, string> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// GST Specific Return Tables
// ============================================

export interface GSTR1Summary {
  period: string;
  b2b: {
    invoiceCount: number;
    taxableValue: string;
    cgst: string;
    sgst: string;
    igst: string;
    totalTax: string;
    invoices: Invoice[];
  };
  b2c_large: {
    invoiceCount: number;
    taxableValue: string;
    igst: string;
    totalTax: string;
  };
  b2c_small: {
    taxableValue: string;
    cgst: string;
    sgst: string;
    igst: string;
    totalTax: string;
  };
  credit_debit_notes: {
    count: number;
    taxableValue: string;
    totalTax: string;
  };
  hsn_summary: Array<{
    hsn: string;
    description: string;
    uqc: string;
    totalQty: string;
    taxableValue: string;
    cgst: string;
    sgst: string;
    igst: string;
    totalTax: string;
  }>;
  totalTaxableValue: string;
  totalTax: string;
}

export interface GSTR3BSummary {
  period: string;
  outward_supplies: {
    taxableValue: string;
    igst: string;
    cgst: string;
    sgst: string;
    cess: string;
  };
  eligible_itc: {
    all_other_itc: {
      igst: string;
      cgst: string;
      sgst: string;
      cess: string;
    };
    net_itc_available: {
      igst: string;
      cgst: string;
      sgst: string;
      cess: string;
    };
  };
  net_tax_payable: {
    igst: string;
    cgst: string;
    sgst: string;
    cess: string;
    total: string;
  };
}

export interface GSTPeriodSummary {
  gstr1: GSTR1Summary;
  gstr3b: GSTR3BSummary;
  netTaxPayable: {
    cgst: string;
    sgst: string;
    igst: string;
    total: string;
  };
}

export interface ImportBatch {
  id: string;
  shop_id: string;
  filename: string;
  source_type: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  duplicate_count: number;
  error_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imported_by: string;
  created_at: string;
}

// ============================================
// Reconciliation
// ============================================

export type MatchType = 'auto_suggested' | 'manual';
export type MatchConfirmation = 'proposed' | 'confirmed' | 'rejected';

export interface TransactionMatch {
  id: string;
  shop_id: string;
  transaction_id: string;
  invoice_id: string;
  allocated_amount: string;
  match_type: MatchType;
  confidence_score: number | null;
  evidence: string | null;
  confirmation_status: MatchConfirmation;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Filing & GST
// ============================================

export type FilingPeriodStatus = 'open' | 'calculating' | 'review' | 'prepared' | 'exported';

export interface FilingPeriod {
  id: string;
  shop_id: string;
  financial_year: string; // e.g., "2024-25"
  period_start: string;
  period_end: string;
  return_type: string; // e.g., "GSTR-3B", "GSTR-1"
  status: FilingPeriodStatus;
  created_at: string;
  updated_at: string;
}

export interface GSTSummary {
  id: string;
  shop_id: string;
  filing_period_id: string;
  engine_version: string;
  ruleset_version: string;
  // Totals
  total_sales: string;
  taxable_sales: string;
  exempt_sales: string;
  total_purchases: string;
  taxable_purchases: string;
  // Output tax
  output_cgst: string;
  output_sgst: string;
  output_igst: string;
  output_cess: string;
  // Input tax (potentially eligible)
  input_cgst: string;
  input_sgst: string;
  input_igst: string;
  input_cess: string;
  // Net
  net_tax_liability: string;
  // Metadata
  invoices_included: number;
  transactions_included: number;
  unresolved_issues: number;
  warnings: string[];
  review_state: ReviewState;
  calculated_at: string;
  created_at: string;
}

// ============================================
// Review Issues
// ============================================

export type IssueSeverity = 'info' | 'warning' | 'error' | 'critical';
export type IssueStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export type IssueType =
  | 'duplicate_invoice'
  | 'arithmetic_discrepancy'
  | 'unmatched_payment'
  | 'missing_invoice_date'
  | 'invalid_gstin'
  | 'uncertain_classification'
  | 'itc_eligibility_question'
  | 'incomplete_invoice'
  | 'unsupported_tax_treatment'
  | 'filing_incomplete'
  | 'extraction_error'
  | 'missing_document';

export interface ReviewIssue {
  id: string;
  shop_id: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  entity_type: string;
  entity_id: string;
  title: string;
  description: string;
  evidence: Record<string, unknown> | null;
  suggested_action: string | null;
  status: IssueStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Audit
// ============================================

export interface AuditEvent {
  id: string;
  shop_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  reason: string | null;
  created_at: string;
}

// ============================================
// Assistant
// ============================================

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: AssistantToolCall[];
  sources?: AssistantSource[];
  timestamp: string;
}

export interface AssistantToolCall {
  tool_name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface AssistantSource {
  type: 'invoice' | 'transaction' | 'summary' | 'rule';
  id: string;
  label: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
