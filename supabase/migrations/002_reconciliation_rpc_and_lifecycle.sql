-- ============================================================================
-- DIGITAX: Migration 002 — Atomic Reconciliation RPC, OCR Jobs, and Snapshots
-- ============================================================================

-- ============================================================================
-- 1. ATOMIC RECONCILIATION RPC FUNCTION
-- Safe, transactional confirmation of invoice & transaction matching with
-- row locking (FOR UPDATE), cross-shop verification, over-allocation prevention,
-- and immutable audit event logging.
-- ============================================================================

CREATE OR REPLACE FUNCTION reconcile_match_atomic(
  p_shop_id UUID,
  p_user_id UUID,
  p_transaction_id UUID,
  p_invoice_id UUID,
  p_allocated_amount NUMERIC(15, 2),
  p_match_method TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_txn RECORD;
  v_inv RECORD;
  v_match_id UUID;
  v_current_txn_matched NUMERIC(15, 2);
  v_new_txn_matched NUMERIC(15, 2);
  v_new_txn_unmatched NUMERIC(15, 2);
  v_new_txn_status TEXT;
  v_current_inv_paid NUMERIC(15, 2);
  v_new_inv_paid NUMERIC(15, 2);
  v_new_inv_due NUMERIC(15, 2);
  v_new_inv_status TEXT;
BEGIN
  -- 1. Input parameter validation
  IF p_allocated_amount IS NULL OR p_allocated_amount <= 0 THEN
    RAISE EXCEPTION 'Allocated amount must be strictly positive (got: %)', p_allocated_amount;
  END IF;

  -- 2. Lock & Retrieve Transaction (FOR UPDATE protects against concurrent match race conditions)
  SELECT * INTO v_txn
  FROM public.transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction with ID % not found', p_transaction_id;
  END IF;

  -- 3. Lock & Retrieve Invoice
  SELECT * INTO v_inv
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice with ID % not found', p_invoice_id;
  END IF;

  -- 4. Multi-Tenant Cross-Shop Isolation Verification
  IF v_txn.shop_id != p_shop_id OR v_inv.shop_id != p_shop_id THEN
    RAISE EXCEPTION 'Cross-shop matching is forbidden: Transaction shop (%), Invoice shop (%), Caller shop (%)',
      v_txn.shop_id, v_inv.shop_id, p_shop_id;
  END IF;

  -- 5. Business direction sanity check
  -- Debits (outgoing) match purchase invoices, Credits (incoming) match sales invoices
  IF (v_txn.direction = 'credit' AND v_inv.direction = 'purchase') OR
     (v_txn.direction = 'debit' AND v_inv.direction = 'sales') THEN
    RAISE EXCEPTION 'Mismatched transaction direction (%) and invoice direction (%)',
      v_txn.direction, v_inv.direction;
  END IF;

  -- 6. Balances and Over-allocation Protection
  v_current_txn_matched := COALESCE(v_txn.matched_amount, 0);
  v_new_txn_matched := v_current_txn_matched + p_allocated_amount;
  
  IF v_new_txn_matched > v_txn.amount THEN
    RAISE EXCEPTION 'Over-allocation on transaction: Total amount is %, already matched is %, attempting to allocate %',
      v_txn.amount, v_current_txn_matched, p_allocated_amount;
  END IF;

  v_current_inv_paid := COALESCE(v_inv.amount_paid, 0);
  v_new_inv_paid := v_current_inv_paid + p_allocated_amount;

  IF v_new_inv_paid > v_inv.total_amount THEN
    RAISE EXCEPTION 'Over-allocation on invoice: Total amount is %, already paid is %, attempting to allocate %',
      v_inv.total_amount, v_current_inv_paid, p_allocated_amount;
  END IF;

  -- 7. Compute updated states
  v_new_txn_unmatched := GREATEST(0, v_txn.amount - v_new_txn_matched);
  IF v_new_txn_unmatched = 0 THEN
    v_new_txn_status := 'matched';
  ELSE
    v_new_txn_status := 'partially_matched';
  END IF;

  v_new_inv_due := GREATEST(0, v_inv.total_amount - v_new_inv_paid);
  IF v_new_inv_due = 0 THEN
    v_new_inv_status := 'paid';
  ELSE
    v_new_inv_status := 'partially_paid';
  END IF;

  -- 8. Insert reconciliation match record
  INSERT INTO public.reconciliation_matches (
    shop_id,
    transaction_id,
    invoice_id,
    allocated_amount,
    match_status,
    match_method,
    manual_review_status,
    reviewer_id,
    confirmed_by,
    reviewed_at,
    confirmed_at
  ) VALUES (
    p_shop_id,
    p_transaction_id,
    p_invoice_id,
    p_allocated_amount,
    'confirmed',
    p_match_method,
    'approved',
    p_user_id,
    p_user_id,
    NOW(),
    NOW()
  ) RETURNING id INTO v_match_id;

  -- 9. Update Transaction record
  UPDATE public.transactions
  SET
    matched_amount = v_new_txn_matched,
    unmatched_amount = v_new_txn_unmatched,
    reconciliation_status = v_new_txn_status,
    updated_at = NOW()
  WHERE id = p_transaction_id;

  -- 10. Update Invoice record
  UPDATE public.invoices
  SET
    amount_paid = v_new_inv_paid,
    amount_due = v_new_inv_due,
    outstanding_balance = v_new_inv_due,
    payment_status = v_new_inv_status,
    updated_at = NOW()
  WHERE id = p_invoice_id;

  -- 11. Record immutable audit log
  INSERT INTO public.audit_events (
    shop_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_shop_id,
    p_user_id,
    'reconciliation_confirmed',
    'reconciliation_match',
    v_match_id,
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'invoice_id', p_invoice_id,
      'allocated_amount', p_allocated_amount,
      'new_txn_unmatched', v_new_txn_unmatched,
      'new_inv_due', v_new_inv_due
    )
  );

  RETURN jsonb_build_object(
    'match_id', v_match_id,
    'transaction_id', p_transaction_id,
    'invoice_id', p_invoice_id,
    'allocated_amount', p_allocated_amount,
    'transaction_status', v_new_txn_status,
    'transaction_unmatched', v_new_txn_unmatched,
    'invoice_status', v_new_inv_status,
    'invoice_due', v_new_inv_due,
    'success', true
  );
END;
$$;

-- ============================================================================
-- 2. SAFE RECONCILIATION REVERSAL RPC FUNCTION
-- Restores transaction and invoice balances, updates match status to 'rejected' / 'reversed'
-- and writes an immutable audit trail without deleting history.
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_reconciliation_match_atomic(
  p_shop_id UUID,
  p_user_id UUID,
  p_match_id UUID,
  p_reason TEXT DEFAULT 'User requested reversal'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_txn RECORD;
  v_inv RECORD;
  v_restored_txn_matched NUMERIC(15, 2);
  v_restored_txn_unmatched NUMERIC(15, 2);
  v_new_txn_status TEXT;
  v_restored_inv_paid NUMERIC(15, 2);
  v_restored_inv_due NUMERIC(15, 2);
  v_new_inv_status TEXT;
BEGIN
  -- 1. Lock match record
  SELECT * INTO v_match
  FROM public.reconciliation_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reconciliation match with ID % not found', p_match_id;
  END IF;

  IF v_match.shop_id != p_shop_id THEN
    RAISE EXCEPTION 'Unauthorized: Match % does not belong to shop %', p_match_id, p_shop_id;
  END IF;

  IF v_match.match_status = 'rejected' THEN
    RAISE EXCEPTION 'Match % is already reversed / rejected', p_match_id;
  END IF;

  -- 2. Lock & update Transaction
  SELECT * INTO v_txn
  FROM public.transactions
  WHERE id = v_match.transaction_id
  FOR UPDATE;

  -- 3. Lock & update Invoice
  SELECT * INTO v_inv
  FROM public.invoices
  WHERE id = v_match.invoice_id
  FOR UPDATE;

  -- 4. Calculate restored balances
  v_restored_txn_matched := GREATEST(0, COALESCE(v_txn.matched_amount, 0) - v_match.allocated_amount);
  v_restored_txn_unmatched := LEAST(v_txn.amount, COALESCE(v_txn.unmatched_amount, 0) + v_match.allocated_amount);
  IF v_restored_txn_matched = 0 THEN
    v_new_txn_status := 'unmatched';
  ELSE
    v_new_txn_status := 'partially_matched';
  END IF;

  v_restored_inv_paid := GREATEST(0, COALESCE(v_inv.amount_paid, 0) - v_match.allocated_amount);
  v_restored_inv_due := LEAST(v_inv.total_amount, COALESCE(v_inv.amount_due, 0) + v_match.allocated_amount);
  IF v_restored_inv_paid = 0 THEN
    v_new_inv_status := 'unpaid';
  ELSE
    v_new_inv_status := 'partially_paid';
  END IF;

  -- 5. Mark match as rejected (reversal status preserved, never deleted)
  UPDATE public.reconciliation_matches
  SET
    match_status = 'rejected',
    manual_review_status = 'overridden',
    evidence = COALESCE(evidence, '') || ' | Reversed: ' || p_reason,
    updated_at = NOW()
  WHERE id = p_match_id;

  -- 6. Update balances on transaction and invoice
  UPDATE public.transactions
  SET
    matched_amount = v_restored_txn_matched,
    unmatched_amount = v_restored_txn_unmatched,
    reconciliation_status = v_new_txn_status,
    updated_at = NOW()
  WHERE id = v_match.transaction_id;

  UPDATE public.invoices
  SET
    amount_paid = v_restored_inv_paid,
    amount_due = v_restored_inv_due,
    outstanding_balance = v_restored_inv_due,
    payment_status = v_new_inv_status,
    updated_at = NOW()
  WHERE id = v_match.invoice_id;

  -- 7. Audit event
  INSERT INTO public.audit_events (
    shop_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_shop_id,
    p_user_id,
    'reconciliation_reversed',
    'reconciliation_match',
    p_match_id,
    jsonb_build_object(
      'reason', p_reason,
      'reversed_amount', v_match.allocated_amount,
      'transaction_id', v_match.transaction_id,
      'invoice_id', v_match.invoice_id
    )
  );

  RETURN jsonb_build_object(
    'match_id', p_match_id,
    'reversed_amount', v_match.allocated_amount,
    'restored_txn_unmatched', v_restored_txn_unmatched,
    'restored_inv_due', v_restored_inv_due,
    'success', true
  );
END;
$$;

