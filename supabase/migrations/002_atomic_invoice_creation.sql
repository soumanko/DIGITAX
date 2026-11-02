-- ============================================================================
-- DIGITAX: Atomic Invoice Creation Migration
-- Migration: 002_atomic_invoice_creation
--
-- Adds a PostgreSQL transactional RPC function `create_invoice_atomic` that
-- wraps invoice header and line item insertion in a single database transaction.
-- If any line item fails, the entire operation rolls back, preventing orphaned
-- invoice headers.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_invoice_atomic(
  p_shop_id UUID,
  p_user_id UUID,
  p_invoice_number TEXT,
  p_invoice_date DATE,
  p_direction TEXT,
  p_invoice_type TEXT,
  p_supplier_name TEXT,
  p_supplier_gstin TEXT,
  p_customer_name TEXT,
  p_customer_gstin TEXT,
  p_place_of_supply TEXT,
  p_subtotal NUMERIC(15,2),
  p_discount_amount NUMERIC(15,2),
  p_taxable_value NUMERIC(15,2),
  p_cgst_amount NUMERIC(15,2),
  p_sgst_amount NUMERIC(15,2),
  p_igst_amount NUMERIC(15,2),
  p_cess_amount NUMERIC(15,2),
  p_total_tax NUMERIC(15,2),
  p_total_amount NUMERIC(15,2),
  p_amount_paid NUMERIC(15,2),
  p_amount_due NUMERIC(15,2),
  p_payment_status TEXT,
  p_review_state TEXT,
  p_notes TEXT,
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  id UUID,
  invoice_number TEXT,
  total_amount NUMERIC(15,2),
  review_state TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  -- Insert invoice header
  INSERT INTO public.invoices (
    shop_id, invoice_number, invoice_date, direction, invoice_type,
    supplier_name, supplier_gstin, customer_name, customer_gstin,
    place_of_supply_state_code, subtotal, discount_total, taxable_value,
    cgst_total, sgst_total, igst_total, cess_total, total_tax,
    total_amount, amount_paid, amount_due, payment_status, review_state, status, notes
  ) VALUES (
    p_shop_id, p_invoice_number, p_invoice_date, p_direction, p_invoice_type,
    p_supplier_name, p_supplier_gstin, p_customer_name, p_customer_gstin,
    p_place_of_supply, p_subtotal, p_discount_amount, p_taxable_value,
    p_cgst_amount, p_sgst_amount, p_igst_amount, p_cess_amount, p_total_tax,
    p_total_amount, p_amount_paid, p_amount_due, p_payment_status, p_review_state, p_review_state, p_notes
  ) RETURNING id INTO v_invoice_id;

  -- Insert line items within the same transaction
  INSERT INTO public.invoice_items (
    invoice_id, line_number, description, hsn_sac_code, quantity,
    unit_price, taxable_value, gst_rate, cgst_amount, sgst_amount,
    igst_amount, cess_amount, total_amount, review_state
  )
  SELECT 
    v_invoice_id,
    COALESCE((item->>'line_number')::INTEGER, 1),
    item->>'description',
    NULLIF(item->>'hsn_sac_code', ''),
    COALESCE((item->>'quantity')::NUMERIC(12,3), 1),
    COALESCE((item->>'unit_price')::NUMERIC(15,2), 0),
    COALESCE((item->>'taxable_value')::NUMERIC(15,2), 0),
    COALESCE((item->>'gst_rate')::NUMERIC(5,2), 0),
    COALESCE((item->>'cgst_amount')::NUMERIC(15,2), 0),
    COALESCE((item->>'sgst_amount')::NUMERIC(15,2), 0),
    COALESCE((item->>'igst_amount')::NUMERIC(15,2), 0),
    COALESCE((item->>'cess_amount')::NUMERIC(15,2), 0),
    COALESCE((item->>'total_amount')::NUMERIC(15,2), 0),
    'pending_review'
  FROM jsonb_array_elements(p_items) AS item;

  -- Log immutable audit event
  INSERT INTO public.audit_events (shop_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (p_shop_id, p_user_id, 'invoice_created', 'invoice', v_invoice_id,
    jsonb_build_object('invoice_number', p_invoice_number, 'total_amount', p_total_amount));

  RETURN QUERY
  SELECT id, invoice_number, total_amount, review_state, status, created_at
  FROM public.invoices
  WHERE id = v_invoice_id;
END;
$$;

-- Grant execute on the function to authenticated users
REVOKE ALL ON FUNCTION public.create_invoice_atomic(
  UUID, UUID, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2),
  NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2),
  NUMERIC(15,2), TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_invoice_atomic(
  UUID, UUID, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2),
  NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2),
  NUMERIC(15,2), TEXT, TEXT, TEXT, JSONB
) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_invoice_atomic(
  UUID, UUID, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2),
  NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2), NUMERIC(15,2),
  NUMERIC(15,2), TEXT, TEXT, TEXT, JSONB
) IS 'Atomically creates an invoice header and its line items in a single transaction. Rolls back entirely if any line item fails. Logs an audit event.';
