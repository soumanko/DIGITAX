import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { money, formatINR, roundMoney, calculateGSTComponents, validateInvoiceArithmetic } from '../decimal';
import { validateGSTIN, calculateTaxComponents, generateGSTPeriodSummary } from '../gst/calculator';
import { findMatchSuggestions } from '../reconciliation/engine';
import { gstinSchema, moneyStringSchema } from '../validation/schemas';
import { DEMO_INVOICES, DEMO_TRANSACTIONS } from '../demo-data';

describe('Audit Test Suite — Core Logic Verification', () => {
  test('Financial decimal formatting with Indian numbering system', () => {
    assert.equal(formatINR('145200.00'), '₹1,45,200.00');
    assert.equal(formatINR('53100'), '₹53,100.00');
    assert.equal(formatINR('0'), '₹0.00');
    assert.equal(formatINR('-5000.50'), '-₹5,000.50');
  });

  test('Decimal rounding standard (ROUND_HALF_UP)', () => {
    const val = roundMoney(money('10.555'));
    assert.equal(val.toFixed(2), '10.56');
    const val2 = roundMoney(money('10.554'));
    assert.equal(val2.toFixed(2), '10.55');
  });

  test('GST components calculation: intra-state split (CGST + SGST)', () => {
    const res = calculateTaxComponents('10000.00', '18.00', '27', '27');
    assert.equal(res.isInterState, false);
    assert.equal(res.cgst.toFixed(2), '900.00');
    assert.equal(res.sgst.toFixed(2), '900.00');
    assert.equal(res.igst.toFixed(2), '0.00');
    assert.equal(res.totalTax.toFixed(2), '1800.00');
    assert.equal(res.totalInvoiceAmount.toFixed(2), '11800.00');
  });

  test('GST components calculation: inter-state (IGST only)', () => {
    const res = calculateTaxComponents('10000.00', '18.00', '27', '24');
    assert.equal(res.isInterState, true);
    assert.equal(res.cgst.toFixed(2), '0.00');
    assert.equal(res.sgst.toFixed(2), '0.00');
    assert.equal(res.igst.toFixed(2), '1800.00');
    assert.equal(res.totalTax.toFixed(2), '1800.00');
  });

  test('GSTIN regex validation & state extraction', () => {
    const valid = validateGSTIN('27AABCS1429B1ZB');
    assert.equal(valid.valid, true);
    assert.equal(valid.stateCode, '27');

    const invalid = validateGSTIN('INVALID123');
    assert.equal(invalid.valid, false);
  });

  test('Zod validation schemas for GSTIN and monetary amounts', () => {
    assert.doesNotThrow(() => gstinSchema.parse('27AABCS1429B1ZB'));
    assert.throws(() => gstinSchema.parse('12345'));
    assert.doesNotThrow(() => moneyStringSchema.parse('45000.00'));
    assert.throws(() => moneyStringSchema.parse('abc'));
  });

  test('Deterministic GSTR-1 and GSTR-3B period summary calculation', () => {
    const summary = generateGSTPeriodSummary('shop-demo-001', 2026, 10, DEMO_INVOICES);
    
    // Check GSTR-1 B2B invoices count & taxable
    assert.equal(summary.gstr1.b2b.invoiceCount, 2);
    assert.equal(summary.gstr1.b2b.taxableValue, '87000.00'); // 52000 + 35000
    
    // Check GSTR-3B Outward supplies
    assert.equal(summary.gstr3b.outward_supplies.taxableValue, '87000.00');
    assert.equal(summary.gstr3b.outward_supplies.cgst, '4680.00');
    assert.equal(summary.gstr3b.outward_supplies.sgst, '4680.00');
    assert.equal(summary.gstr3b.outward_supplies.igst, '4200.00');

    // Check GSTR-3B Inward Eligible ITC (Apex 4050+4050, HUL 3438+3438, Brit 1665+1665)
    assert.equal(summary.gstr3b.eligible_itc.all_other_itc.cgst, '9153.00');
    assert.equal(summary.gstr3b.eligible_itc.all_other_itc.sgst, '9153.00');

    // Net tax payable: Outward tax (CGST 4680, SGST 4680, IGST 4200) offset against ITC (CGST 9153, SGST 9153)
    // CGST payable = max(0, 4680 - 9153) = 0.00
    // SGST payable = max(0, 4680 - 9153) = 0.00
    // IGST payable = 4200.00
    assert.equal(summary.netTaxPayable.cgst, '0.00');
    assert.equal(summary.netTaxPayable.sgst, '0.00');
    assert.equal(summary.netTaxPayable.igst, '4200.00');
  });

  test('Reconciliation heuristic engine detects candidate matches', () => {
    const suggestions = findMatchSuggestions(DEMO_INVOICES, DEMO_TRANSACTIONS);
    assert.ok(Array.isArray(suggestions));
    // Check that candidates are scored and ranked
    for (const c of suggestions) {
      assert.ok(c.confidenceScore > 0 && c.confidenceScore <= 1);
      assert.ok(c.matchReasons.length > 0);
    }
  });

  test('Line item arithmetic cross-validation within tolerance', () => {
    const lineItems = [
      { taxableValue: '21000.00', totalAmount: '22050.00' },
      { taxableValue: '24000.00', totalAmount: '25200.00' },
    ];
    const validation = validateInvoiceArithmetic(lineItems, '45000.00', '47250.00', 1);
    assert.equal(validation.valid, true);

    const badValidation = validateInvoiceArithmetic(lineItems, '50000.00', '47250.00', 1);
    assert.equal(badValidation.valid, false);
  });
});
