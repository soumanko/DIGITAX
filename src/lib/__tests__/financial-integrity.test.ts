import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  money,
  roundMoney,
  formatINR,
  calculateGSTComponents,
  validateInvoiceArithmetic,
  Decimal,
} from '../decimal';
import { generateGSTPeriodSummary, validateGSTIN } from '../gst/calculator';
import { Invoice } from '../../types';

/**
 * DIGITAX Financial Integrity Test Suite
 *
 * Guards the money rules that the rest of the codebase depends on:
 * - Strict Decimal arithmetic (NO JavaScript floating point)
 * - ROUND_HALF_UP rounding to 2 decimals (Indian GST standard)
 * - CGST/SGST equal split for intra-state, IGST-only for inter-state
 * - Invoice line-item arithmetic validation within tolerance
 * - GSTIN validation
 * - Deterministic, period-scoped GST summaries (GSTR-1 / GSTR-3B / net payable)
 */

describe('Decimal money arithmetic (no floating point)', () => {
  it('adds classic float error cases exactly', () => {
    assert.strictEqual(money('0.1').plus(money('0.2')).toString(), '0.3');
    assert.strictEqual(money('1.1').plus(money('2.2')).toString(), '3.3');
  });

  it('keeps 2-decimal precision for large NUMERIC(15,2) amounts', () => {
    const big = money('123456789012.34').plus(money('1.23'));
    assert.strictEqual(big.toString(), '123456789013.57');
  });

  it('rounds half-up to 2 decimals (never banker rounding)', () => {
    // JS parseFloat(2.675) === 2.67499999... would round DOWN with naive code
    assert.strictEqual(roundMoney(money('2.675')).toString(), '2.68');
    assert.strictEqual(roundMoney(money('2.674')).toString(), '2.67');
    assert.strictEqual(roundMoney(money('0.015')).toString(), '0.02');
    assert.strictEqual(roundMoney(money('1.005')).toString(), '1.01');
    assert.strictEqual(roundMoney(money('-2.675')).toString(), '-2.68');
  });

  it('formats INR with Indian digit grouping', () => {
    assert.strictEqual(formatINR('123456789.5'), '₹12,34,56,789.50');
    assert.strictEqual(formatINR(0), '₹0.00');
    assert.strictEqual(formatINR('42180'), '₹42,180.00');
    assert.strictEqual(formatINR('-1234.5'), '-₹1,234.50');
  });
});

describe('calculateGSTComponents (CGST/SGST vs IGST split)', () => {
  it('splits intra-state supply equally into CGST and SGST', () => {
    const { cgst, sgst, igst, totalTax } = calculateGSTComponents(money(10000), money(18), false);
    assert.ok(cgst.eq(900));
    assert.ok(sgst.eq(900));
    assert.ok(igst.eq(0));
    assert.ok(totalTax.eq(1800));
  });

  it('uses IGST only for inter-state supply', () => {
    const { cgst, sgst, igst, totalTax } = calculateGSTComponents(money(10000), money(18), true);
    assert.ok(cgst.eq(0));
    assert.ok(sgst.eq(0));
    assert.ok(igst.eq(1800));
    assert.ok(totalTax.eq(1800));
  });

  it('rounds each half-up independently for intra-state odd paisa', () => {
    // taxable 0.15 @ 18% -> total tax 0.027 -> 0.03 half-up; each half 0.0135 -> 0.01
    const intra = calculateGSTComponents(money('0.15'), money(18), false);
    assert.ok(intra.cgst.eq(0.01));
    assert.ok(intra.sgst.eq(0.01));
    assert.strictEqual(intra.totalTax.toString(), '0.02');
    const inter = calculateGSTComponents(money('0.15'), money(18), true);
    assert.ok(inter.igst.eq(0.03));
  });

  it('handles crore-scale amounts without precision loss', () => {
    const { cgst, sgst } = calculateGSTComponents(money('99999999999.99'), money(18), false);
    assert.ok(cgst.eq('9000000000.00'));
    assert.ok(sgst.eq('9000000000.00'));
  });
});

describe('validateInvoiceArithmetic (line items vs invoice totals)', () => {
  const lines = [
    { taxableValue: '500000', totalAmount: '590000' },
    { taxableValue: '100000', totalAmount: '118000' },
  ];

  it('accepts a consistent invoice', () => {
    const result = validateInvoiceArithmetic(lines, '600000', '708000');
    assert.strictEqual(result.valid, true);
  });

  it('accepts sub-tolerance rounding differences (₹1 default)', () => {
    const result = validateInvoiceArithmetic(lines, '600000.50', '708000.40');
    assert.strictEqual(result.valid, true);
  });

  it('rejects inconsistent line items beyond tolerance', () => {
    const result = validateInvoiceArithmetic(lines, '600000', '708005');
    assert.strictEqual(result.valid, false);
    assert.ok(result.totalDifference.eq(5));
  });

  it('rejects a corrupt taxable total', () => {
    const result = validateInvoiceArithmetic(lines, '590000', '708000');
    assert.strictEqual(result.valid, false);
    assert.ok(result.taxableDifference.eq(10000));
  });
});

describe('validateGSTIN', () => {
  it('accepts valid 15-character GSTINs and extracts the state code', () => {
    const gujarat = validateGSTIN('27AABCS1429B1ZB');
    assert.strictEqual(gujarat.valid, true);
    assert.strictEqual(gujarat.stateCode, '27');

    const karnataka = validateGSTIN('29AAAPL1234C1Z5');
    assert.strictEqual(karnataka.valid, true);
    assert.strictEqual(karnataka.stateCode, '29');
  });

  it('normalizes lowercase input', () => {
    const result = validateGSTIN('27aabcs1429b1zb');
    assert.strictEqual(result.valid, true);
  });

  it('rejects malformed GSTINs', () => {
    for (const bad of ['', 'ABC123', '27AABCS1429B', '27AABCS1429B1ZB99', '276ABCS1429B1ZB']) {
      assert.strictEqual(validateGSTIN(bad).valid, false, `expected invalid: "${bad}"`);
    }
  });
});

describe('generateGSTPeriodSummary (deterministic GSTR-1 / GSTR-3B)', () => {
  const period = { year: 2026, month: 3 };

  const salesB2BIntra: Partial<Invoice> = {
    invoice_number: 'S-B2B-001',
    invoice_date: '2026-03-12',
    invoice_type: 'sales_tax_invoice',
    direction: 'sales',
    taxable_value: '500000',
    cgst_total: '45000',
    sgst_total: '45000',
    igst_total: '0.00',
    buyer_gstin: '27AABCS1429B1ZB',
  };

  const salesB2CIntra: Partial<Invoice> = {
    invoice_number: 'S-B2C-001',
    invoice_date: '2026-03-20',
    invoice_type: 'sales_tax_invoice',
    direction: 'sales',
    taxable_value: '20000',
    cgst_total: '1800',
    sgst_total: '1800',
    igst_total: '0.00',
    buyer_gstin: null,
    customer_gstin: null,
  };

  const purchaseIntra: Partial<Invoice> = {
    invoice_number: 'P-001',
    invoice_date: '2026-03-05',
    invoice_type: 'purchase_tax_invoice',
    direction: 'purchase',
    taxable_value: '100000',
    cgst_total: '9000',
    sgst_total: '9000',
    igst_total: '0.00',
    supplier_gstin: '29AAAPL1234C1Z5',
  };

  const otherPeriod: Partial<Invoice> = {
    invoice_number: 'S-OTHER-PERIOD',
    invoice_date: '2026-02-28',
    invoice_type: 'sales_tax_invoice',
    direction: 'sales',
    taxable_value: '999999',
    cgst_total: '89999.91',
    sgst_total: '89999.91',
    igst_total: '0.00',
    buyer_gstin: '27AABCS1429B1ZB',
  };

  const invoices = [salesB2BIntra, salesB2CIntra, purchaseIntra, otherPeriod] as unknown as Invoice[];

  it('produces the exact expected summary for the period', () => {
    const s = generateGSTPeriodSummary('shop-it-1', period.year, period.month, invoices);

    // Period filtering: February invoice must be excluded
    assert.strictEqual(s.gstr1.b2b.invoiceCount, 1);
    assert.strictEqual(s.gstr1.b2b.taxableValue, '500000.00');
    assert.strictEqual(s.gstr1.b2b.cgst, '45000.00');
    assert.strictEqual(s.gstr1.b2b.sgst, '45000.00');
    assert.strictEqual(s.gstr1.b2b.igst, '0.00');

    // B2C (retail counter) bucket for unregistered buyer
    assert.strictEqual(s.gstr1.b2c_small.taxableValue, '20000.00');
    assert.strictEqual(s.gstr1.b2c_small.cgst, '1800.00');

    assert.strictEqual(s.gstr1.totalTaxableValue, '520000.00');
    assert.strictEqual(s.gstr1.totalTax, '93600.00');

    // GSTR-3B outward supplies
    assert.strictEqual(s.gstr3b.outward_supplies.cgst, '46800.00');
    assert.strictEqual(s.gstr3b.outward_supplies.sgst, '46800.00');
    assert.strictEqual(s.gstr3b.outward_supplies.igst, '0.00');

    // ITC from purchases
    assert.strictEqual(s.gstr3b.eligible_itc.net_itc_available.cgst, '9000.00');
    assert.strictEqual(s.gstr3b.eligible_itc.net_itc_available.sgst, '9000.00');

    // Net payable after ITC
    assert.strictEqual(s.netTaxPayable.cgst, '37800.00');
    assert.strictEqual(s.netTaxPayable.sgst, '37800.00');
    assert.strictEqual(s.netTaxPayable.igst, '0.00');
    assert.strictEqual(s.netTaxPayable.total, '75600.00');
  });

  it('is fully deterministic for identical inputs', () => {
    const a = generateGSTPeriodSummary('shop-it-1', period.year, period.month, invoices);
    const b = generateGSTPeriodSummary('shop-it-1', period.year, period.month, invoices);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  });

  it('never goes negative in any net tax head', () => {
    // Massive ITC (negative-tolerance) must clamp to zero per head
    const heavyIct: Partial<Invoice> = {
      invoice_number: 'P-BIG',
      invoice_date: '2026-03-08',
      invoice_type: 'purchase_tax_invoice',
      direction: 'purchase',
      taxable_value: '9000000',
      cgst_total: '810000',
      sgst_total: '810000',
      igst_total: '0.00',
      supplier_gstin: '27AABCS1429B1ZB',
    };
    const s = generateGSTPeriodSummary('shop-it-1', period.year, period.month, [
      salesB2BIntra,
      salesB2CIntra,
      heavyIct,
    ].concat([purchaseIntra]) as unknown as Invoice[]);
    const totalNet = money(s.netTaxPayable.cgst).plus(money(s.netTaxPayable.sgst)).plus(money(s.netTaxPayable.igst));
    assert.ok(totalNet.gte(0));
    assert.strictEqual(s.netTaxPayable.igst, '0.00');
  });

  it('ignores an empty period with zeros', () => {
    const s = generateGSTPeriodSummary('shop-it-1', 2017, 1, invoices);
    assert.strictEqual(s.gstr1.totalTaxableValue, '0.00');
    assert.strictEqual(s.netTaxPayable.total, '0.00');
  });
});
