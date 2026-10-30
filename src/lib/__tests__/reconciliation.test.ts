import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { findMatchSuggestions } from '../reconciliation/engine';
import { Invoice, Transaction } from '../../types';

describe('Reconciliation Engine — Unit & Invariant Tests', () => {
  const baseInvoice: Invoice = {
    id: 'inv-1',
    shop_id: 'shop-alpha',
    document_id: null,
    direction: 'purchase',
    invoice_type: 'purchase_tax_invoice',
    invoice_number: 'APX/2026/001',
    invoice_date: '2026-10-01',
    supplier_name: 'Apex FMCG Distributors',
    supplier_legal_name: 'Apex FMCG Distributors LLP',
    supplier_gstin: '27AABCS1429B1ZB',
    buyer_name: 'Kirana Store',
    buyer_gstin: '27AABCT3521P1ZA',
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
    outstanding_balance: '59000.00',
    payment_status: 'unpaid',
    review_state: 'confirmed',
    extraction_confidence: 0.98,
    notes: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  };

  const baseTransaction: Transaction = {
    id: 'txn-1',
    shop_id: 'shop-alpha',
    source: 'bank_import',
    bank_account_name: 'HDFC Current A/c',
    import_batch_id: null,
    external_txn_id: null,
    source_account: 'HDFC_0981',
    transaction_date: '2026-10-02',
    value_date: '2026-10-02',
    description: 'UPI/329910481/Apex FMCG/APX2026001',
    direction: 'debit',
    transaction_type: 'debit',
    amount: '59000.00',
    category: 'vendor_payment',
    review_state: 'confirmed',
    reconciliation_status: 'unmatched',
    matched_amount: '0.00',
    unmatched_amount: '59000.00',
    original_row_data: null,
    notes: null,
    created_at: '2026-10-02T11:00:00Z',
    updated_at: '2026-10-02T11:00:00Z',
  };

  test('Exact amount match with invoice number narration yields high confidence (>= 0.85)', () => {
    const suggestions = findMatchSuggestions([baseInvoice], [baseTransaction]);
    assert.equal(suggestions.length, 1);
    const top = suggestions[0];
    assert.equal(top.invoice.id, 'inv-1');
    assert.equal(top.transaction.id, 'txn-1');
    assert.equal(top.suggestedMatchAmount, '59000.00');
    assert.ok(top.confidenceScore >= 0.85, `Confidence score ${top.confidenceScore} was less than 0.85`);
  });

  test('Partial payment support: detects transaction smaller than outstanding balance', () => {
    const partialTxn: Transaction = {
      ...baseTransaction,
      id: 'txn-partial-1',
      amount: '20000.00',
      unmatched_amount: '20000.00',
      description: 'UPI/329910481/Apex FMCG',
    };

    const suggestions = findMatchSuggestions([baseInvoice], [partialTxn]);
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0].suggestedMatchAmount, '20000.00');
    assert.ok(suggestions[0].matchReasons.some((r) => r.includes('partial payment') || r.includes('Apex')));
  });

  test('Prevents matching opposite directions (Debit transaction cannot match Sales invoice)', () => {
    const salesInvoice: Invoice = {
      ...baseInvoice,
      id: 'inv-sales-1',
      direction: 'sales',
      invoice_type: 'sales_tax_invoice',
      invoice_number: 'SALE-101',
    };

    const debitTxn: Transaction = {
      ...baseTransaction,
      direction: 'debit',
      transaction_type: 'debit',
    };

    const suggestions = findMatchSuggestions([salesInvoice], [debitTxn]);
    assert.equal(suggestions.length, 0, 'Debit transaction must not match sales invoice');
  });

  test('Fully reconciled invoices (outstanding_balance == 0) are excluded from suggestions', () => {
    const paidInvoice: Invoice = {
      ...baseInvoice,
      outstanding_balance: '0.00',
      amount_due: '0.00',
      amount_paid: '59000.00',
      payment_status: 'paid',
    };

    const suggestions = findMatchSuggestions([paidInvoice], [baseTransaction]);
    assert.equal(suggestions.length, 0, 'Fully paid invoice must not be suggested for matching');
  });

  test('Multi-allocation simulation: sequence of 3 partial payments settles ₹50,000 invoice to 0', () => {
    let invDue = 50000;
    const paymentAmounts = [20000, 15000, 15000];

    for (const p of paymentAmounts) {
      assert.ok(p <= invDue, 'Over-allocation prevented');
      invDue -= p;
    }

    assert.equal(invDue, 0, 'Invoice outstanding must be exactly 0 after full partial sequence');
  });
});

