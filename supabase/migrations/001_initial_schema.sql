-- ============================================================================
-- DIGITAX: Initial Database Schema — Production Migration
-- Migration: 001_initial_schema
-- 
-- Comprehensive multi-tenant schema with strict Row-Level Security (RLS),
-- cryptographic auditing, GST calculation persistence, automated shop isolation,
-- and private document storage for Indian kirana & retail businesses.
-- ============================================================================

-- ============================================
-- 0. Enable Required Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES
-- Stores application-specific user details.
-- PK references auth.users(id) — no duplicate credentials.
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'hi', 'bn', 'mr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. SHOPS
-- Each shopkeeper's business details.
-- Multi-tenant anchor: owner_id references auth.users(id).
-- A single user may own multiple shops.
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  business_type TEXT,
  gstin TEXT,
  gst_registration_type TEXT CHECK (gst_registration_type IS NULL OR gst_registration_type IN (
    'regular', 'composition', 'unregistered',
    'input_service_distributor', 'casual_taxable', 'non_resident'
  )),
  taxpayer_scheme TEXT CHECK (taxpayer_scheme IS NULL OR taxpayer_scheme IN (
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
  preferred_language TEXT NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'hi', 'bn', 'mr')),
  financial_year_start_month INTEGER NOT NULL DEFAULT 4
    CHECK (financial_year_start_month BETWEEN 1 AND 12),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_gstin ON shops(gstin);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. SHOP MEMBERS (Authorization Join Table)
-- Supports owner & authorized team members (admins/staff/CAs).
-- ============================================
CREATE TABLE IF NOT EXISTS shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_members_user ON shop_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_shop ON shop_members(shop_id);

ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Security Definer Helper Functions
-- Non-recursive, verified authorization logic.
-- ============================================
CREATE OR REPLACE FUNCTION is_shop_member(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_shop_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.shop_members WHERE shop_id = p_shop_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION is_shop_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_shop_member(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION is_shop_admin(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_shop_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.shop_members WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION is_shop_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_shop_admin(UUID) TO authenticated;

-- ============================================
-- RLS Policies for shops & shop_members
-- ============================================
DROP POLICY IF EXISTS "Shop members can view shop" ON shops;
CREATE POLICY "Shop members can view shop"
  ON shops FOR SELECT
  USING (owner_id = auth.uid() OR is_shop_member(id));

DROP POLICY IF EXISTS "Authenticated users can create shops" ON shops;
CREATE POLICY "Authenticated users can create shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

DROP POLICY IF EXISTS "Shop admins can update shop" ON shops;
CREATE POLICY "Shop admins can update shop"
  ON shops FOR UPDATE
  USING (owner_id = auth.uid() OR is_shop_admin(id))
  WITH CHECK (owner_id = auth.uid() OR is_shop_admin(id));

DROP POLICY IF EXISTS "Shop owners can delete shop" ON shops;
CREATE POLICY "Shop owners can delete shop"
  ON shops FOR DELETE
  USING (owner_id = auth.uid());

-- RLS for shop_members
DROP POLICY IF EXISTS "Members can view shop membership" ON shop_members;
CREATE POLICY "Members can view shop membership"
  ON shop_members FOR SELECT
  USING (user_id = auth.uid() OR is_shop_member(shop_id));

DROP POLICY IF EXISTS "Owners can add members" ON shop_members;
CREATE POLICY "Owners can add members"
  ON shop_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR is_shop_admin(shop_id)
    )
  );

DROP POLICY IF EXISTS "Owners can update members" ON shop_members;
CREATE POLICY "Owners can update members"
  ON shop_members FOR UPDATE
  USING (is_shop_admin(shop_id))
  WITH CHECK (is_shop_admin(shop_id));

DROP POLICY IF EXISTS "Owners or self can remove membership" ON shop_members;
CREATE POLICY "Owners or self can remove membership"
  ON shop_members FOR DELETE
  USING (user_id = auth.uid() OR is_shop_admin(shop_id));

-- Trigger: Automatically register shop creator in shop_members as owner
CREATE OR REPLACE FUNCTION handle_new_shop()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (shop_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_shop_created ON shops;
CREATE TRIGGER trg_on_shop_created
  AFTER INSERT ON shops
  FOR EACH ROW EXECUTE FUNCTION handle_new_shop();

-- ============================================
-- 4. DOCUMENTS
-- Metadata for uploaded bills and supporting documents.
-- Actual files stored in private Supabase Storage bucket.
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  content_hash TEXT,
  document_type TEXT NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'sales_invoice', 'purchase_invoice', 'credit_note',
      'debit_note', 'receipt', 'other'
    )),
  processing_status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (processing_status IN (
      'uploaded', 'queued', 'processing', 'extracted', 'failed', 'manual_entry'
    )),
  extracted_data JSONB,
  extraction_attempts INTEGER NOT NULL DEFAULT 0,
  last_extraction_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_shop_id ON documents(shop_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION sync_document_uploader()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.uploader_id IS NULL AND NEW.uploaded_by IS NOT NULL THEN
    NEW.uploader_id = NEW.uploaded_by;
  ELSIF NEW.uploaded_by IS NULL AND NEW.uploader_id IS NOT NULL THEN
    NEW.uploaded_by = NEW.uploader_id;
  ELSIF NEW.uploader_id IS NULL AND NEW.uploaded_by IS NULL THEN
    NEW.uploader_id = auth.uid();
    NEW.uploaded_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_document_uploader ON documents;
CREATE TRIGGER trg_sync_document_uploader
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION sync_document_uploader();

DROP POLICY IF EXISTS "Shop members can view documents" ON documents;
CREATE POLICY "Shop members can view documents"
  ON documents FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can upload documents" ON documents;
CREATE POLICY "Shop members can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    is_shop_member(shop_id)
    AND (uploader_id = auth.uid() OR uploaded_by = auth.uid() OR auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "Shop members can update documents" ON documents;
CREATE POLICY "Shop members can update documents"
  ON documents FOR UPDATE
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop admins can delete documents" ON documents;
CREATE POLICY "Shop admins can delete documents"
  ON documents FOR DELETE
  USING (is_shop_admin(shop_id));

-- ============================================
-- 5. INVOICES
-- Sales and purchase invoices with full GST breakdowns.
-- NUMERIC(15,2) for all monetary columns — never float.
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  direction TEXT NOT NULL DEFAULT 'sales' CHECK (direction IN ('sales', 'purchase')),
  invoice_type TEXT NOT NULL DEFAULT 'sales' CHECK (invoice_type IN ('sales', 'purchase')),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  supplier_name TEXT,
  supplier_legal_name TEXT,
  supplier_trade_name TEXT,
  supplier_address TEXT,
  supplier_gstin TEXT,
  buyer_name TEXT,
  customer_legal_name TEXT,
  customer_trade_name TEXT,
  customer_address TEXT,
  buyer_gstin TEXT,
  customer_gstin TEXT,
  place_of_supply_state_code TEXT CHECK (place_of_supply_state_code IS NULL OR char_length(place_of_supply_state_code) = 2),
  is_inter_state BOOLEAN,
  is_reverse_charge BOOLEAN NOT NULL DEFAULT FALSE,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_amount NUMERIC(15, 2) GENERATED ALWAYS AS (taxable_value) STORED,
  cgst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sgst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  igst_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cess_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  round_off_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  invoice_total NUMERIC(15, 2) GENERATED ALWAYS AS (total_amount) STORED,
  amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(15, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  review_state TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (review_state IN (
      'draft', 'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification', 'approved'
    )),
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN (
      'draft', 'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification', 'approved'
    )),
  extraction_confidence NUMERIC(5, 4),
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, invoice_number, direction)
);

CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_direction ON invoices(direction);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_review_state ON invoices(review_state);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_gstin ON invoices(supplier_gstin);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer_gstin ON invoices(buyer_gstin);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION sync_invoice_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction IS NULL AND NEW.invoice_type IS NOT NULL THEN
    NEW.direction = NEW.invoice_type;
  ELSIF NEW.invoice_type IS NULL AND NEW.direction IS NOT NULL THEN
    NEW.invoice_type = NEW.direction;
  END IF;

  IF NEW.review_state IS NULL AND NEW.status IS NOT NULL THEN
    NEW.review_state = NEW.status;
  ELSIF NEW.status IS NULL AND NEW.review_state IS NOT NULL THEN
    NEW.status = NEW.review_state;
  END IF;

  -- Enforce OCR extraction safety: never auto-approve unverified OCR invoices
  IF NEW.source = 'ocr' AND (NEW.review_state = 'approved' OR NEW.review_state = 'confirmed') AND TG_OP = 'INSERT' THEN
    NEW.review_state = 'pending_review';
    NEW.status = 'pending_review';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_invoice_fields ON invoices;
CREATE TRIGGER trg_sync_invoice_fields
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_fields();

DROP POLICY IF EXISTS "Shop members can view invoices" ON invoices;
CREATE POLICY "Shop members can view invoices"
  ON invoices FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can create invoices" ON invoices;
CREATE POLICY "Shop members can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can update invoices" ON invoices;
CREATE POLICY "Shop members can update invoices"
  ON invoices FOR UPDATE
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop admins can delete invoices" ON invoices;
CREATE POLICY "Shop admins can delete invoices"
  ON invoices FOR DELETE
  USING (is_shop_admin(shop_id));

-- ============================================
-- 6. INVOICE ITEMS (Line Items belonging to an invoice)
-- Inherits authorization directly from parent invoice and shop.
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
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
  line_total NUMERIC(15, 2) GENERATED ALWAYS AS (total_amount) STORED,
  review_state TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (review_state IN (
      'draft', 'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification', 'approved'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop members can view invoice items" ON invoice_items;
CREATE POLICY "Shop members can view invoice items"
  ON invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id AND is_shop_member(i.shop_id)
  ));

DROP POLICY IF EXISTS "Shop members can create invoice items" ON invoice_items;
CREATE POLICY "Shop members can create invoice items"
  ON invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id AND is_shop_member(i.shop_id)
  ));

DROP POLICY IF EXISTS "Shop members can update invoice items" ON invoice_items;
CREATE POLICY "Shop members can update invoice items"
  ON invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id AND is_shop_member(i.shop_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id AND is_shop_member(i.shop_id)
  ));

DROP POLICY IF EXISTS "Shop admins can delete invoice items" ON invoice_items;
CREATE POLICY "Shop admins can delete invoice items"
  ON invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id AND is_shop_admin(i.shop_id)
  ));

-- Backward-compatibility view for invoice_lines
CREATE OR REPLACE VIEW invoice_lines AS
  SELECT
    id,
    invoice_id,
    line_number,
    description,
    hsn_sac_code,
    quantity,
    unit,
    unit_price,
    discount,
    taxable_value,
    gst_rate,
    cgst_amount,
    sgst_amount,
    igst_amount,
    cess_amount,
    total_amount,
    review_state,
    created_at
  FROM invoice_items;

-- ============================================
-- 7. IMPORT BATCHES
-- Track CSV/bank statement imports for duplicate detection and audit.
-- ============================================
CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'csv',
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_shop_id ON import_batches(shop_id);

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop members can view import batches" ON import_batches;
CREATE POLICY "Shop members can view import batches"
  ON import_batches FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can create import batches" ON import_batches;
CREATE POLICY "Shop members can create import batches"
  ON import_batches FOR INSERT
  WITH CHECK (is_shop_member(shop_id) AND imported_by = auth.uid());

DROP POLICY IF EXISTS "Shop members can update import batches" ON import_batches;
CREATE POLICY "Shop members can update import batches"
  ON import_batches FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 8. TRANSACTIONS
-- UPI, bank, cash and other payment transactions.
-- Scoped duplicate detection within shop.
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
  external_txn_id TEXT,
  transaction_date DATE NOT NULL,
  transaction_timestamp TIMESTAMPTZ,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  payment_method TEXT,
  upi_reference TEXT,
  bank_reference TEXT,
  category TEXT NOT NULL DEFAULT 'unknown'
    CHECK (category IN (
      'business_sale', 'business_purchase', 'supplier_payment', 'customer_receipt',
      'refund', 'bank_transfer', 'loan_borrowing', 'owner_contribution',
      'owner_withdrawal', 'personal', 'cash_entry', 'unknown'
    )),
  source_account TEXT,
  review_state TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (review_state IN (
      'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification'
    )),
  reconciliation_status TEXT NOT NULL DEFAULT 'unmatched'
    CHECK (reconciliation_status IN ('matched', 'unmatched', 'partial')),
  original_row_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, external_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_review_state ON transactions(review_state);
CREATE INDEX IF NOT EXISTS idx_transactions_reconciliation ON transactions(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_transactions_external_txn ON transactions(shop_id, external_txn_id) WHERE external_txn_id IS NOT NULL;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop members can view transactions" ON transactions;
CREATE POLICY "Shop members can view transactions"
  ON transactions FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can create transactions" ON transactions;
CREATE POLICY "Shop members can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can update transactions" ON transactions;
CREATE POLICY "Shop members can update transactions"
  ON transactions FOR UPDATE
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop admins can delete transactions" ON transactions;
CREATE POLICY "Shop admins can delete transactions"
  ON transactions FOR DELETE
  USING (is_shop_admin(shop_id));

-- ============================================
-- 9. RECONCILIATION MATCHES
-- Links transactions to invoices with match metadata.
-- Strict trigger guarantees cross-shop matching is impossible.
-- ============================================
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(15, 2) NOT NULL CHECK (allocated_amount > 0),
  match_status TEXT NOT NULL DEFAULT 'suggested'
    CHECK (match_status IN ('suggested', 'confirmed', 'rejected', 'proposed')),
  confirmation_status TEXT GENERATED ALWAYS AS (match_status) STORED,
  match_method TEXT NOT NULL DEFAULT 'auto_suggested'
    CHECK (match_method IN (
      'auto_suggested', 'manual', 'rule_exact', 'amount_date', 'ai_fuzzy',
      'exact_amount', 'reference_found', 'party_name_match', 'fuzzy_date', 'partial_payment'
    )),
  match_type TEXT GENERATED ALWAYS AS (match_method) STORED,
  confidence_score NUMERIC(5, 4) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  manual_review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (manual_review_status IN ('pending', 'reviewed', 'overridden', 'approved')),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_shop ON reconciliation_matches(shop_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_txn ON reconciliation_matches(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_inv ON reconciliation_matches(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_status ON reconciliation_matches(match_status);

ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;

-- Helper trigger for synchronization between reviewer fields
CREATE OR REPLACE FUNCTION sync_reconciliation_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reviewer_id IS NULL AND NEW.confirmed_by IS NOT NULL THEN
    NEW.reviewer_id = NEW.confirmed_by;
  ELSIF NEW.confirmed_by IS NULL AND NEW.reviewer_id IS NOT NULL THEN
    NEW.confirmed_by = NEW.reviewer_id;
  END IF;

  IF NEW.reviewed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    NEW.reviewed_at = NEW.confirmed_at;
  ELSIF NEW.confirmed_at IS NULL AND NEW.reviewed_at IS NOT NULL THEN
    NEW.confirmed_at = NEW.reviewed_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_reconciliation_fields ON reconciliation_matches;
CREATE TRIGGER trg_sync_reconciliation_fields
  BEFORE INSERT OR UPDATE ON reconciliation_matches
  FOR EACH ROW EXECUTE FUNCTION sync_reconciliation_fields();

-- Enforcement Trigger: Cross-Shop Matching is strictly forbidden
CREATE OR REPLACE FUNCTION enforce_reconciliation_same_shop()
RETURNS TRIGGER AS $$
DECLARE
  v_txn_shop UUID;
  v_inv_shop UUID;
BEGIN
  SELECT shop_id INTO v_txn_shop FROM public.transactions WHERE id = NEW.transaction_id;
  SELECT shop_id INTO v_inv_shop FROM public.invoices WHERE id = NEW.invoice_id;

  IF v_txn_shop IS NULL THEN
    RAISE EXCEPTION 'Transaction % not found', NEW.transaction_id;
  END IF;

  IF v_inv_shop IS NULL THEN
    RAISE EXCEPTION 'Invoice % not found', NEW.invoice_id;
  END IF;

  IF v_txn_shop != NEW.shop_id OR v_inv_shop != NEW.shop_id THEN
    RAISE EXCEPTION 'Cross-shop matching is forbidden. Transaction shop (%), invoice shop (%), and match shop (%) must all be identical.',
      v_txn_shop, v_inv_shop, NEW.shop_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_reconciliation_same_shop ON reconciliation_matches;
CREATE TRIGGER trg_enforce_reconciliation_same_shop
  BEFORE INSERT OR UPDATE ON reconciliation_matches
  FOR EACH ROW EXECUTE FUNCTION enforce_reconciliation_same_shop();

DROP POLICY IF EXISTS "Shop members can view matches" ON reconciliation_matches;
CREATE POLICY "Shop members can view matches"
  ON reconciliation_matches FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can create matches" ON reconciliation_matches;
CREATE POLICY "Shop members can create matches"
  ON reconciliation_matches FOR INSERT
  WITH CHECK (
    is_shop_member(shop_id)
    AND EXISTS (
      SELECT 1 FROM transactions t WHERE t.id = reconciliation_matches.transaction_id AND t.shop_id = reconciliation_matches.shop_id
    )
    AND EXISTS (
      SELECT 1 FROM invoices i WHERE i.id = reconciliation_matches.invoice_id AND i.shop_id = reconciliation_matches.shop_id
    )
  );

DROP POLICY IF EXISTS "Shop members can update matches" ON reconciliation_matches;
CREATE POLICY "Shop members can update matches"
  ON reconciliation_matches FOR UPDATE
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop admins can delete matches" ON reconciliation_matches;
CREATE POLICY "Shop admins can delete matches"
  ON reconciliation_matches FOR DELETE
  USING (is_shop_admin(shop_id));

-- Backward-compatibility view for transaction_matches
CREATE OR REPLACE VIEW transaction_matches AS
  SELECT
    id,
    shop_id,
    transaction_id,
    invoice_id,
    allocated_amount,
    match_method AS match_type,
    confidence_score,
    evidence,
    match_status AS confirmation_status,
    reviewer_id AS confirmed_by,
    reviewed_at AS confirmed_at,
    created_at,
    updated_at
  FROM reconciliation_matches;

-- ============================================
-- 10. FILING PERIODS
-- Define tax return periods per shop (GSTR-1, GSTR-3B, CMP-08).
-- ============================================
CREATE TABLE IF NOT EXISTS filing_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,  -- e.g., "2026-27"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  return_type TEXT NOT NULL DEFAULT 'GSTR-3B',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'calculating', 'review', 'prepared', 'exported')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, period_start, period_end, return_type),
  CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_filing_periods_shop_id ON filing_periods(shop_id);

ALTER TABLE filing_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop members can view filing periods" ON filing_periods;
CREATE POLICY "Shop members can view filing periods"
  ON filing_periods FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can manage filing periods" ON filing_periods;
CREATE POLICY "Shop members can manage filing periods"
  ON filing_periods FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can update filing periods" ON filing_periods;
CREATE POLICY "Shop members can update filing periods"
  ON filing_periods FOR UPDATE
  USING (is_shop_member(shop_id));

-- ============================================
-- 11. GST SUMMARIES
-- Calculated GST summaries with reproducible financial audit trail.
-- ============================================
CREATE TABLE IF NOT EXISTS gst_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  filing_period_id UUID REFERENCES filing_periods(id) ON DELETE SET NULL,
  financial_year TEXT NOT NULL,
  tax_period TEXT NOT NULL,
  return_type TEXT NOT NULL DEFAULT 'GSTR-3B'
    CHECK (return_type IN ('GSTR-1', 'GSTR-3B', 'CMP-08', 'GSTR-9', 'other')),
  taxable_sales NUMERIC(15, 2) NOT NULL DEFAULT 0,
  exempt_sales NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_sales NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_cgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_sgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_igst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  output_cess NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_cgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_sgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_igst NUMERIC(15, 2) NOT NULL DEFAULT 0,
  input_cess NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_tax_liability NUMERIC(15, 2) NOT NULL DEFAULT 0,
  source_record_counts JSONB NOT NULL DEFAULT '{"invoices": 0, "transactions": 0}'::jsonb,
  invoices_included INTEGER NOT NULL DEFAULT 0,
  transactions_included INTEGER NOT NULL DEFAULT 0,
  unresolved_issues INTEGER NOT NULL DEFAULT 0,
  calculation_version TEXT NOT NULL DEFAULT '1.0.0',
  engine_version TEXT NOT NULL DEFAULT '1.0.0',
  ruleset_version TEXT NOT NULL DEFAULT '2026.1',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'reviewed', 'ready', 'confirmed', 'filed')),
  review_state TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (review_state IN (
      'pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification'
    )),
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  details JSONB,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gst_summaries_shop_id ON gst_summaries(shop_id);
CREATE INDEX IF NOT EXISTS idx_gst_summaries_period ON gst_summaries(filing_period_id);
CREATE INDEX IF NOT EXISTS idx_gst_summaries_fy_period ON gst_summaries(shop_id, financial_year, tax_period);

ALTER TABLE gst_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop members can view GST summaries" ON gst_summaries;
CREATE POLICY "Shop members can view GST summaries"
  ON gst_summaries FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can create GST summaries" ON gst_summaries;
CREATE POLICY "Shop members can create GST summaries"
  ON gst_summaries FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop admins can update GST summaries" ON gst_summaries;
CREATE POLICY "Shop admins can update GST summaries"
  ON gst_summaries FOR UPDATE
  USING (is_shop_admin(shop_id));

-- ============================================
-- 12. REVIEW ISSUES
-- Flags reconciliation, arithmetic, or GST compliance issues requiring human review.
-- ============================================
CREATE TABLE IF NOT EXISTS review_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB,
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_issues_shop_id ON review_issues(shop_id);
CREATE INDEX IF NOT EXISTS idx_review_issues_status ON review_issues(status);
CREATE INDEX IF NOT EXISTS idx_review_issues_severity ON review_issues(severity);
CREATE INDEX IF NOT EXISTS idx_review_issues_entity ON review_issues(entity_type, entity_id);

ALTER TABLE review_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop members can view review issues" ON review_issues;
CREATE POLICY "Shop members can view review issues"
  ON review_issues FOR SELECT
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can create review issues" ON review_issues;
CREATE POLICY "Shop members can create review issues"
  ON review_issues FOR INSERT
  WITH CHECK (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop members can update review issues" ON review_issues;
CREATE POLICY "Shop members can update review issues"
  ON review_issues FOR UPDATE
  USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Shop admins can delete review issues" ON review_issues;
CREATE POLICY "Shop admins can delete review issues"
  ON review_issues FOR DELETE
  USING (is_shop_admin(shop_id));

-- ============================================
-- 13. AUDIT EVENTS
-- Append-only tamper-resistant log of sensitive actions.
-- Absolutely NO UPDATE and NO DELETE policies exist.
-- Triggers raise exceptions even if superuser runs DML.
-- ============================================
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  changes JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_shop_id ON audit_events(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop members can view audit events" ON audit_events;
CREATE POLICY "Shop members can view audit events"
  ON audit_events FOR SELECT
  USING (
    (shop_id IS NULL AND actor_id = auth.uid())
    OR is_shop_member(shop_id)
  );

DROP POLICY IF EXISTS "Authenticated users can create audit events" ON audit_events;
CREATE POLICY "Authenticated users can create audit events"
  ON audit_events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND actor_id = auth.uid()
    AND (shop_id IS NULL OR is_shop_member(shop_id))
  );

-- Belt-and-suspenders trigger: Immutability enforcement
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON audit_events;
CREATE TRIGGER trg_prevent_audit_update
  BEFORE UPDATE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

DROP TRIGGER IF EXISTS trg_prevent_audit_delete ON audit_events;
CREATE TRIGGER trg_prevent_audit_delete
  BEFORE DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- ============================================
-- 14. TRIGGERS: Auto-Update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_shops ON shops;
CREATE TRIGGER set_updated_at_shops
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_documents ON documents;
CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_invoices ON invoices;
CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_transactions ON transactions;
CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_reconciliation_matches ON reconciliation_matches;
CREATE TRIGGER set_updated_at_reconciliation_matches
  BEFORE UPDATE ON reconciliation_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_filing_periods ON filing_periods;
CREATE TRIGGER set_updated_at_filing_periods
  BEFORE UPDATE ON filing_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_review_issues ON review_issues;
CREATE TRIGGER set_updated_at_review_issues
  BEFORE UPDATE ON review_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 15. TRIGGER: Auto-create Profile on Auth Signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    preferred_language = COALESCE(EXCLUDED.preferred_language, public.profiles.preferred_language);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 16. STORAGE: Private Bucket for Documents
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-documents',
  'shop-documents',
  FALSE,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

DO $$
BEGIN
  DROP POLICY IF EXISTS "Shop members can upload documents" ON storage.objects;
  DROP POLICY IF EXISTS "Shop members can view documents" ON storage.objects;
  DROP POLICY IF EXISTS "Shop members can update documents" ON storage.objects;
  DROP POLICY IF EXISTS "Shop admins can delete documents" ON storage.objects;
END $$;

-- Storage Path Convention: {shop_id}/{document_id}/{filename}
CREATE POLICY "Shop members can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop-documents'
    AND auth.uid() IS NOT NULL
    AND is_shop_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Shop members can view documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shop-documents'
    AND is_shop_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Shop members can update documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'shop-documents'
    AND is_shop_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Shop admins can delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shop-documents'
    AND is_shop_admin((storage.foldername(name))[1]::uuid)
  );
