import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateGSTPeriodSummary, calculateTaxComponents, validateGSTIN } from '../gst/calculator';
import { Invoice } from '../../types';

describe('GST Calculation & Classification Engine Tests', () => {
  test('Validates official 15-character Indian GSTIN and extracts state code', () => {
    const valid = validateGSTIN('27AABCS1429B1ZB');
    assert.equal(valid.valid, true);
    assert.equal(valid.stateCode, '27');

    const invalid = validateGSTIN('27INVALID123');
    assert.equal(invalid.valid, false);
  });

  test('Intra-state supply splits tax equally into CGST and SGST (9% + 9% for 18% rate)', () => {
    const res = calculateTaxComponents(10000, 18, '27', '27');
    assert.equal(res.isInterState, false);
    assert.equal(res.cgst.toString(), '900');
    assert.equal(res.sgst.toString(), '900');
    assert.equal(res.igst.toString(), '0');
    assert.equal(res.totalInvoiceAmount.toString(), '11800');
  });

  test('Inter-state supply allocates 100% of tax to IGST (18% for 18% rate)', () => {
    const res = calculateTaxComponents(10000, 18, '27', '29'); // MH to KA
    assert.equal(res.isInterState, true);
    assert.equal(res.cgst.toString(), '0');
    assert.equal(res.sgst.toString(), '0');
    assert.equal(res.igst.toString(), '1800');
    assert.equal(res.totalInvoiceAmount.toString(), '11800');
  });

  test('Excludes cancelled invoices from GSTR-1 and GSTR-3B period calculations', () => {
    const invoices: Invoice[] = [
      {
        id: 'inv-active',
        shop_id: 'shop-1',
        document_id: null,
        direction: 'sales',
        invoice_type: 'sales_tax_invoice',
        invoice_status: 'issued',
        invoice_number: 'INV-1',
        invoice_date: '2026-10-10',
        supplier_name: null,
        supplier_gstin: null,
        buyer_name: 'Customer A',
        buyer_gstin: null,
        customer_gstin: null,
        place_of_supply_state_code: '27',
        is_inter_state: false,
        subtotal: '1000.00',
        discount_total: '0.00',
        taxable_value: '1000.00',
        cgst_total: '90.00',
        sgst_total: '90.00',
        igst_total: '0.00',
        cess_total: '0.00',
        total_amount: '1180.00',
        amount_paid: '0.00',
        amount_due: '1180.00',
        review_state: 'confirmed',
        extraction_confidence: 1,
        notes: null,
        created_at: '2026-10-10T00:00:00Z',
        updated_at: '2026-10-10T00:00:00Z',
      },
      {
        id: 'inv-cancelled',
        shop_id: 'shop-1',
        document_id: null,
        direction: 'sales',
        invoice_type: 'sales_tax_invoice',
        invoice_status: 'cancelled',
        invoice_number: 'INV-CANCELLED',
        invoice_date: '2026-10-12',
        supplier_name: null,
        supplier_gstin: null,
        buyer_name: 'Customer Void',
        buyer_gstin: null,
        customer_gstin: null,
        place_of_supply_state_code: '27',
        is_inter_state: false,
        subtotal: '50000.00',
        discount_total: '0.00',
        taxable_value: '50000.00',
        cgst_total: '4500.00',
        sgst_total: '4500.00',
        igst_total: '0.00',
        cess_total: '0.00',
        total_amount: '59000.00',
        amount_paid: '0.00',
        amount_due: '59000.00',
        review_state: 'confirmed',
        extraction_confidence: 1,
        notes: null,
        created_at: '2026-10-12T00:00:00Z',
        updated_at: '2026-10-12T00:00:00Z',
      },
    ];

    const summary = generateGSTPeriodSummary('shop-1', 2026, 10, invoices);
    assert.equal(summary.gstr1.totalTaxableValue, '1000.00', 'Cancelled invoice must be excluded from taxable turnover');
    assert.equal(summary.gstr1.totalTax, '180.00', 'Cancelled invoice must not contribute to outward tax liability');
  });

  test('Ineligible ITC is excluded from net available credit', () => {
    const purchaseInvoices: Invoice[] = [
      {
        id: 'pur-eligible',
        shop_id: 'shop-1',
        document_id: null,
        direction: 'purchase',
        invoice_type: 'purchase_tax_invoice',
        invoice_number: 'BILL-1',
        invoice_date: '2026-10-15',
        supplier_name: 'Stock Distributor',
        supplier_gstin: '27AABCS1429B1ZB',
        buyer_name: 'Shop',
        buyer_gstin: '27AABCT3521P1ZA',
        place_of_supply_state_code: '27',
        is_inter_state: false,
        subtotal: '10000.00',
        discount_total: '0.00',
        taxable_value: '10000.00',
        cgst_total: '900.00',
        sgst_total: '900.00',
        igst_total: '0.00',
        cess_total: '0.00',
        total_amount: '11800.00',
        amount_paid: '11800.00',
        amount_due: '0.00',
        review_state: 'confirmed',
        extraction_confidence: 1,
        notes: null,
        created_at: '2026-10-15T00:00:00Z',
        updated_at: '2026-10-15T00:00:00Z',
      },
      {
        id: 'pur-blocked',
        shop_id: 'shop-1',
        document_id: null,
        direction: 'purchase',
        invoice_type: 'purchase_tax_invoice',
        invoice_number: 'BILL-FOOD-17-5',
        invoice_date: '2026-10-16',
        supplier_name: 'Catering Section 17(5) Blocked',
        supplier_gstin: '27AABCS1429B1ZB',
        buyer_name: 'Shop',
        buyer_gstin: '27AABCT3521P1ZA',
        place_of_supply_state_code: '27',
        is_inter_state: false,
        subtotal: '5000.00',
        discount_total: '0.00',
        taxable_value: '5000.00',
        cgst_total: '450.00',
        sgst_total: '450.00',
        igst_total: '0.00',
        cess_total: '0.00',
        total_amount: '5900.00',
        amount_paid: '5900.00',
        amount_due: '0.00',
        review_state: 'confirmed',
        extraction_confidence: 1,
        notes: null,
        created_at: '2026-10-16T00:00:00Z',
        updated_at: '2026-10-16T00:00:00Z',
      },
    ];

    (purchaseInvoices[1] as any).is_itc_ineligible = true;

    const summary = generateGSTPeriodSummary('shop-1', 2026, 10, purchaseInvoices);
    assert.equal(summary.gstr3b.eligible_itc.net_itc_available.cgst, '900.00');
    assert.equal(summary.gstr3b.eligible_itc.net_itc_available.sgst, '900.00');
  });
});

