-- DIGITAX: Initial Database Schema
-- Migration: 001_initial_schema
-- This migration creates all core tables with constraints, indexes, and RLS policies.

-- ============================================
-- Enable required extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'bn', 'mr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. SHOPS
-- ============================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  business_type TEXT,
  gstin TEXT,
  gst_registration_type TEXT CHECK (gst_registration_type IN (
    'regular', 'composition', 'unregistered', 
    'input_service_distributor', 'casual_taxable', 'non_resident'
  )),
  taxpayer_scheme TEXT CHECK (taxpayer_scheme IN (
    'regular', 'composition_goods', 'composition_services', 'qrmp'
  )),
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT CHECK (state_code IS NULL OR char_length(state_code) = 2),
  pincode TEXT CHECK (pincode IS NULL OR pincode ~ '^[1-9][0-9]{5}$'),
  phone TEXT,
  email TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'bn', 'mr')),
  financial_year_start_month INTEGER NOT NULL DEFAULT 4 CHECK (financial_year_start_month BETWEEN 1 AND 12),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. SHOP MEMBERS (authorization)
-- ============================================
CREATE TABLE shop_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a member of a shop
CREATE OR REPLACE FUNCTION is_shop_member(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shop_members 
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for shops: members can read, owners/admins can update
CREATE POLICY "Shop members can view shop"
  ON shops FOR SELECT
  USING (is_shop_member(id));

CREATE POLICY "Shop owners can update shop"
  ON shops FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM shop_members 
    WHERE shop_id = shops.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Authenticated users can create shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS for shop_members
CREATE POLICY "Members can view shop membership"
  ON shop_members FOR SELECT
  USING (user_id = auth.uid() OR is_shop_member(shop_id));

CREATE POLICY "Owners can manage members"
  ON shop_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM shop_members sm
        WHERE sm.shop_id = shop_members.shop_id 
        AND sm.user_id = auth.uid() 
        AND sm.role = 'owner'
      )
    )
  );

CREATE POLICY "Owners can remove members"
  ON shop_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shop_members sm
      WHERE sm.shop_id = shop_members.shop_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'owner'
    )
  );

-- ============================================
-- 4. DOCUMENTS
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  content_hash TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other' CHECK (document_type IN (
    'sales_invoice', 'purchase_invoice', 'credit_note', 'debit_note', 'receipt', 'other'
  )),
  processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN (
    'uploaded', 'queued', 'processing', 'extracted', 'failed', 'manual_entry'
  )),
  extraction_attempts INTEGER NOT NULL DEFAULT 0,
  last_extraction_error TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_shop_id ON documents(shop_id);
CREATE INDEX idx_documents_content_hash ON documents(content_hash);
CREATE INDEX idx_documents_processing_status ON documents(processing_status);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view documents"
  ON documents FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can upload documents"
  ON documents FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "Shop members can update documents"
  ON documents FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 5. INVOICES
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('sales', 'purchase')),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  supplier_name TEXT,
  supplier_gstin TEXT,
  buyer_name TEXT,
  buyer_gstin TEXT,
  place_of_supply_state_code TEXT,
  is_inter_state BOOLEAN,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cgst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sgst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  igst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cess_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(15, 2) NOT NULL DEFAULT 0,
  review_state TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_state IN (
    'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification'
  )),
  extraction_confidence NUMERIC(5, 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, invoice_number, direction)
);

CREATE INDEX idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX idx_invoices_direction ON invoices(direction);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_review_state ON invoices(review_state);
CREATE INDEX idx_invoices_supplier_gstin ON invoices(supplier_gstin);
CREATE INDEX idx_invoices_buyer_gstin ON invoices(buyer_gstin);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view invoices"
  ON invoices FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "Shop members can update invoices"
  ON invoices FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 6. INVOICE LINES
-- ============================================
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  hsn_sac_code TEXT,
  quantity NUMERIC(12, 3),
  unit TEXT,
  unit_price NUMERIC(15, 2),
  discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cess_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  review_state TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_state IN (
    'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id, line_number)
);

CREATE INDEX idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);

ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view invoice lines"
  ON invoice_lines FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND is_shop_member(i.shop_id)
  ));

CREATE POLICY "Shop members can create invoice lines"
  ON invoice_lines FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND is_shop_member(i.shop_id)
  ));

CREATE POLICY "Shop members can update invoice lines"
  ON invoice_lines FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND is_shop_member(i.shop_id)
  ));

-- ============================================
-- 7. IMPORT BATCHES
-- ============================================
CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'csv',
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_batches_shop_id ON import_batches(shop_id);

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view import batches"
  ON import_batches FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can create import batches"
  ON import_batches FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "Shop members can update import batches"
  ON import_batches FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 8. TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
  external_txn_id TEXT,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  category TEXT NOT NULL DEFAULT 'unknown' CHECK (category IN (
    'business_sale', 'business_purchase', 'supplier_payment', 'customer_receipt',
    'refund', 'bank_transfer', 'loan_borrowing', 'owner_contribution',
    'owner_withdrawal', 'personal', 'cash_entry', 'unknown'
  )),
  source_account TEXT,
  review_state TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_state IN (
    'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification'
  )),
  original_row_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate imports (same external ID in same shop)
  UNIQUE(shop_id, external_txn_id)
);

CREATE INDEX idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_review_state ON transactions(review_state);
CREATE INDEX idx_transactions_import_batch ON transactions(import_batch_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view transactions"
  ON transactions FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "Shop members can update transactions"
  ON transactions FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 9. TRANSACTION MATCHES (Reconciliation)
-- ============================================
CREATE TABLE transaction_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(15, 2) NOT NULL CHECK (allocated_amount > 0),
  match_type TEXT NOT NULL DEFAULT 'auto_suggested' CHECK (match_type IN ('auto_suggested', 'manual')),
  confidence_score NUMERIC(5, 4),
  evidence TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'proposed' CHECK (confirmation_status IN ('proposed', 'confirmed', 'rejected')),
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_matches_shop_id ON transaction_matches(shop_id);
CREATE INDEX idx_transaction_matches_transaction ON transaction_matches(transaction_id);
CREATE INDEX idx_transaction_matches_invoice ON transaction_matches(invoice_id);
CREATE INDEX idx_transaction_matches_status ON transaction_matches(confirmation_status);

ALTER TABLE transaction_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view matches"
  ON transaction_matches FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can create matches"
  ON transaction_matches FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "Shop members can update matches"
  ON transaction_matches FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 10. FILING PERIODS
-- ============================================
CREATE TABLE filing_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL, -- e.g., "2024-25"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  return_type TEXT NOT NULL DEFAULT 'GSTR-3B',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'calculating', 'review', 'prepared', 'exported')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, period_start, period_end, return_type)
);

CREATE INDEX idx_filing_periods_shop_id ON filing_periods(shop_id);

ALTER TABLE filing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view filing periods"
  ON filing_periods FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can manage filing periods"
  ON filing_periods FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "Shop members can update filing periods"
  ON filing_periods FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 11. GST SUMMARIES
-- ============================================
CREATE TABLE gst_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  filing_period_id UUID NOT NULL REFERENCES filing_periods(id) ON DELETE CASCADE,
  engine_version TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  total_sales NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_sales NUMERIC(15, 2) NOT NULL DEFAULT 0,
  exempt_sales NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_cgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_sgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_igst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_cess NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_cgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_sgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_igst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_cess NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_tax_liability NUMERIC(15, 2) NOT NULL DEFAULT 0,
  invoices_included INTEGER NOT NULL DEFAULT 0,
  transactions_included INTEGER NOT NULL DEFAULT 0,
  unresolved_issues INTEGER NOT NULL DEFAULT 0,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_state TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_state IN (
    'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification'
  )),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gst_summaries_shop_id ON gst_summaries(shop_id);
CREATE INDEX idx_gst_summaries_period ON gst_summaries(filing_period_id);

ALTER TABLE gst_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view GST summaries"
  ON gst_summaries FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can create GST summaries"
  ON gst_summaries FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

-- ============================================
-- 12. REVIEW ISSUES
-- ============================================
CREATE TABLE review_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB,
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_issues_shop_id ON review_issues(shop_id);
CREATE INDEX idx_review_issues_status ON review_issues(status);
CREATE INDEX idx_review_issues_severity ON review_issues(severity);
CREATE INDEX idx_review_issues_entity ON review_issues(entity_type, entity_id);

ALTER TABLE review_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view review issues"
  ON review_issues FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can create review issues"
  ON review_issues FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "Shop members can update review issues"
  ON review_issues FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 13. AUDIT EVENTS
-- ============================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_shop_id ON audit_events(shop_id);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Audit events are append-only — no UPDATE or DELETE
CREATE POLICY "Shop members can view audit events"
  ON audit_events FOR SELECT
  USING (is_shop_member(shop_id));

CREATE POLICY "Shop members can create audit events"
  ON audit_events FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

-- ============================================
-- 14. TRIGGERS: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_shops
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_transaction_matches
  BEFORE UPDATE ON transaction_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_filing_periods
  BEFORE UPDATE ON filing_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_review_issues
  BEFORE UPDATE ON review_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 15. FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
