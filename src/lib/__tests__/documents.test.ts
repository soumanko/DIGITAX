import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseRawInvoiceText } from '../documents/ocr-processor';

describe('Document Upload & OCR Processor Tests', () => {
  test('Extracts GSTIN, invoice number, date, and computes tax split from text', () => {
    const rawInvoiceText = `
      TAX INVOICE
      Supplier: APEX WHOLESALE PVT LTD
      GSTIN: 27AABCS1429B1ZB
      Invoice No: APX-9941
      Date: 14/10/2026
      Buyer: SHREE GANESH KIRANA
      Buyer GSTIN: 27AABCT3521P1ZA
      Description: Rice Bags (25kg)
      Taxable Amount: 10000.00
      Total: 11800.00
    `;

    const result = parseRawInvoiceText(rawInvoiceText, 'test_invoice.txt');

    assert.equal(result.supplier_gstin, '27AABCS1429B1ZB');
    assert.equal(result.buyer_gstin, '27AABCT3521P1ZA');
    assert.equal(result.invoice_number, 'APX-9941');
    assert.equal(result.invoice_date, '2026-10-14');
    assert.equal(result.taxable_amount, '10000.00');
    assert.equal(result.cgst, '900.00');
    assert.equal(result.sgst, '900.00');
    assert.equal(result.total_amount, '11800.00');
    assert.ok(result.confidence >= 0.85);
  });

  test('Reports validation issues when supplier GSTIN is missing', () => {
    const unformattedText = `
      Cash Memo
      Receipt # 4401
      Total: 500.00
    `;

    const result = parseRawInvoiceText(unformattedText, 'receipt.txt');
    assert.equal(result.supplier_gstin, null);
    assert.ok(result.validation_issues.some((issue) => issue.includes('Supplier GSTIN not detected')));
  });
});

