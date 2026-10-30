import Decimal from 'decimal.js';
import { money, roundMoney } from '../decimal';
import { Invoice, GSTR1Summary, GSTR3BSummary } from '../../types';

export interface GSTCalculationResult {
  taxableValue: Decimal;
  cgst: Decimal;
  sgst: Decimal;
  igst: Decimal;
  cess: Decimal;
  totalTax: Decimal;
  totalInvoiceAmount: Decimal;
  isInterState: boolean;
}

/**
 * Validates 15-character Indian GSTIN with state code prefix and checksum format
 */
export function validateGSTIN(gstin: string): { valid: boolean; stateCode?: string; error?: string } {
  if (!gstin) return { valid: false, error: 'GSTIN is required' };
  const cleaned = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(cleaned)) {
    return { valid: false, error: 'Invalid GSTIN format (must be 15 alphanumeric characters e.g. 27AABCS1429B1ZB)' };
  }
  return { valid: true, stateCode: cleaned.slice(0, 2) };
}

/**
 * Compute deterministic GST components for given taxable value, rate, and place of supply
 */
export function calculateTaxComponents(
  taxableAmount: string | number | Decimal,
  ratePercentage: string | number | Decimal,
  supplierStateCode: string,
  placeOfSupplyStateCode: string
): GSTCalculationResult {
  const taxable = money(taxableAmount);
  const rate = money(ratePercentage);
  const isInterState = supplierStateCode !== placeOfSupplyStateCode;

  const totalTax = roundMoney(taxable.mul(rate).div(100));

  if (isInterState) {
    return {
      taxableValue: taxable,
      cgst: money(0),
      sgst: money(0),
      igst: totalTax,
      cess: money(0),
      totalTax,
      totalInvoiceAmount: roundMoney(taxable.plus(totalTax)),
      isInterState: true,
    };
  }

  // Intra-state supply: split equally between CGST and SGST
  const halfRate = rate.div(2);
  const cgst = roundMoney(taxable.mul(halfRate).div(100));
  const sgst = roundMoney(taxable.mul(halfRate).div(100));

  return {
    taxableValue: taxable,
    cgst,
    sgst,
    igst: money(0),
    cess: money(0),
    totalTax: cgst.plus(sgst),
    totalInvoiceAmount: roundMoney(taxable.plus(cgst).plus(sgst)),
    isInterState: false,
  };
}

/**
 * Generate GSTR-1 and GSTR-3B period summaries from a list of verified invoices
 * Accounting for credit/debit notes, cancelled invoices, nil/exempt supplies,
 * B2B vs B2C large (> 2.5L inter-state) vs B2C small, and ITC eligibility rules.
 */
export function generateGSTPeriodSummary(
  shopId: string,
  periodYear: number,
  periodMonth: number,
  invoices: Invoice[]
): {
  gstr1: GSTR1Summary;
  gstr3b: GSTR3BSummary;
  netTaxPayable: {
    cgst: string;
    sgst: string;
    igst: string;
    total: string;
  };
} {
  // Filter invoices for the requested period, excluding cancelled or void invoices
  const periodStr = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
  const periodInvoices = invoices.filter((inv) => {
    const isCancelled = inv.invoice_status === 'cancelled' || inv.status === 'cancelled';
    if (isCancelled) return false;
    return inv.invoice_date && inv.invoice_date.startsWith(periodStr);
  });

  // GSTR-1: Outward Supplies (Sales)
  const salesInvoices = periodInvoices.filter(
    (inv) => inv.direction === 'sales' || inv.invoice_type === 'sales_tax_invoice'
  );

  let b2bTaxable = money(0);
  let b2bCGST = money(0);
  let b2bSGST = money(0);
  let b2bIGST = money(0);
  let b2bCount = 0;

  let b2cLargeTaxable = money(0);
  let b2cLargeIGST = money(0);
  let b2cLargeCount = 0;

  let b2cSmallTaxable = money(0);
  let b2cSmallCGST = money(0);
  let b2cSmallSGST = money(0);
  let b2cSmallIGST = money(0);

  let cdnCount = 0;
  let cdnTaxable = money(0);
  let cdnTax = money(0);

  const hsnMap = new Map<string, {
    description: string;
    uqc: string;
    totalQty: Decimal;
    taxableValue: Decimal;
    cgst: Decimal;
    sgst: Decimal;
    igst: Decimal;
    totalTax: Decimal;
  }>();

  for (const inv of salesInvoices) {
    const cgstVal = money(inv.cgst_amount || inv.cgst_total || '0.00');
    const sgstVal = money(inv.sgst_amount || inv.sgst_total || '0.00');
    const igstVal = money(inv.igst_amount || inv.igst_total || '0.00');
    const taxableVal = money(inv.taxable_value || '0.00');
    const totalVal = money(inv.total_amount || '0.00');

    // Aggregate line items for HSN summary if available
    const lines = (inv as any).lines || (inv as any).invoice_items || [];
    for (const line of lines) {
      const hsn = (line.hsn_code || line.hsn || '9999').toString();
      const existing = hsnMap.get(hsn) || {
        description: line.description || 'Goods / Services',
        uqc: line.unit || 'NOS',
        totalQty: money(0),
        taxableValue: money(0),
        cgst: money(0),
        sgst: money(0),
        igst: money(0),
        totalTax: money(0),
      };
      existing.totalQty = existing.totalQty.plus(money(line.quantity || 1));
      existing.taxableValue = existing.taxableValue.plus(money(line.taxable_value || 0));
      existing.cgst = existing.cgst.plus(money(line.cgst_amount || 0));
      existing.sgst = existing.sgst.plus(money(line.sgst_amount || 0));
      existing.igst = existing.igst.plus(money(line.igst_amount || 0));
      existing.totalTax = existing.totalTax.plus(money(line.total_amount || 0).minus(money(line.taxable_value || 0)));
      hsnMap.set(hsn, existing);
    }

    const hasCustomerGstin = Boolean(inv.customer_gstin || inv.buyer_gstin);

    if (inv.invoice_type === 'credit_note' || inv.invoice_type === 'debit_note') {
      cdnCount++;
      cdnTaxable = cdnTaxable.plus(taxableVal);
      cdnTax = cdnTax.plus(cgstVal.plus(sgstVal).plus(igstVal));
    } else if (hasCustomerGstin) {
      // B2B Supply
      b2bCount++;
      b2bTaxable = b2bTaxable.plus(taxableVal);
      b2bCGST = b2bCGST.plus(cgstVal);
      b2bSGST = b2bSGST.plus(sgstVal);
      b2bIGST = b2bIGST.plus(igstVal);
    } else {
      // Unregistered B2C
      // Inter-state invoice with value > ₹2,50,000 qualifies as B2C Large under GST rules
      const isInterState = igstVal.gt(0);
      if (isInterState && totalVal.gt(250000)) {
        b2cLargeCount++;
        b2cLargeTaxable = b2cLargeTaxable.plus(taxableVal);
        b2cLargeIGST = b2cLargeIGST.plus(igstVal);
      } else {
        b2cSmallTaxable = b2cSmallTaxable.plus(taxableVal);
        b2cSmallCGST = b2cSmallCGST.plus(cgstVal);
        b2cSmallSGST = b2cSmallSGST.plus(sgstVal);
        b2cSmallIGST = b2cSmallIGST.plus(igstVal);
      }
    }
  }

  // Format HSN summary list
  const hsn_summary = Array.from(hsnMap.entries()).map(([hsn, d]) => ({
    hsn,
    description: d.description,
    uqc: d.uqc,
    totalQty: d.totalQty.toFixed(2),
    taxableValue: d.taxableValue.toFixed(2),
    cgst: d.cgst.toFixed(2),
    sgst: d.sgst.toFixed(2),
    igst: d.igst.toFixed(2),
    totalTax: d.totalTax.toFixed(2),
  }));

  // GSTR-3B: Inward Supplies (Input Tax Credit / Purchases)
  const purchaseInvoices = periodInvoices.filter(
    (inv) => inv.direction === 'purchase' || inv.invoice_type === 'purchase_tax_invoice'
  );

  let itcTaxable = money(0);
  let itcCGST = money(0);
  let itcSGST = money(0);
  let itcIGST = money(0);

  for (const inv of purchaseInvoices) {
    // Check ITC eligibility: Blocked credits (e.g., Section 17(5) food, motor vehicles) or composition purchases are ineligible
    const isITCIneligible = (inv as any).is_itc_ineligible === true || (inv as any).itc_eligibility === 'ineligible';
    if (isITCIneligible) continue;

    const cgstVal = money(inv.cgst_amount || inv.cgst_total || '0.00');
    const sgstVal = money(inv.sgst_amount || inv.sgst_total || '0.00');
    const igstVal = money(inv.igst_amount || inv.igst_total || '0.00');

    itcTaxable = itcTaxable.plus(money(inv.taxable_value || '0.00'));
    itcCGST = itcCGST.plus(cgstVal);
    itcSGST = itcSGST.plus(sgstVal);
    itcIGST = itcIGST.plus(igstVal);
  }

  // Total Outward Tax Liability across all outward supply channels
  const totalOutwardCGST = b2bCGST.plus(b2cSmallCGST);
  const totalOutwardSGST = b2bSGST.plus(b2cSmallSGST);
  const totalOutwardIGST = b2bIGST.plus(b2cLargeIGST).plus(b2cSmallIGST);
  const totalOutwardTax = totalOutwardCGST.plus(totalOutwardSGST).plus(totalOutwardIGST);
  const totalOutwardTaxable = b2bTaxable.plus(b2cLargeTaxable).plus(b2cSmallTaxable);

  // Net Tax Liability (Outward Tax minus Eligible ITC)
  const netCGST = Decimal.max(0, totalOutwardCGST.minus(itcCGST));
  const netSGST = Decimal.max(0, totalOutwardSGST.minus(itcSGST));
  const netIGST = Decimal.max(0, totalOutwardIGST.minus(itcIGST));
  const netTotal = netCGST.plus(netSGST).plus(netIGST);

  const gstr1: GSTR1Summary = {
    period: periodStr,
    b2b: {
      invoiceCount: b2bCount,
      taxableValue: b2bTaxable.toFixed(2),
      cgst: b2bCGST.toFixed(2),
      sgst: b2bSGST.toFixed(2),
      igst: b2bIGST.toFixed(2),
      totalTax: b2bCGST.plus(b2bSGST).plus(b2bIGST).toFixed(2),
      invoices: salesInvoices.filter((i) => Boolean(i.customer_gstin || i.buyer_gstin)),
    },
    b2c_large: {
      invoiceCount: b2cLargeCount,
      taxableValue: b2cLargeTaxable.toFixed(2),
      igst: b2cLargeIGST.toFixed(2),
      totalTax: b2cLargeIGST.toFixed(2),
    },
    b2c_small: {
      taxableValue: b2cSmallTaxable.toFixed(2),
      cgst: b2cSmallCGST.toFixed(2),
      sgst: b2cSmallSGST.toFixed(2),
      igst: b2cSmallIGST.toFixed(2),
      totalTax: b2cSmallCGST.plus(b2cSmallSGST).plus(b2cSmallIGST).toFixed(2),
    },
    credit_debit_notes: {
      count: cdnCount,
      taxableValue: cdnTaxable.toFixed(2),
      totalTax: cdnTax.toFixed(2),
    },
    hsn_summary,
    totalTaxableValue: totalOutwardTaxable.toFixed(2),
    totalTax: totalOutwardTax.toFixed(2),
  };

  const gstr3b: GSTR3BSummary = {
    period: periodStr,
    outward_supplies: {
      taxableValue: totalOutwardTaxable.toFixed(2),
      igst: totalOutwardIGST.toFixed(2),
      cgst: totalOutwardCGST.toFixed(2),
      sgst: totalOutwardSGST.toFixed(2),
      cess: '0.00',
    },
    eligible_itc: {
      all_other_itc: {
        igst: itcIGST.toFixed(2),
        cgst: itcCGST.toFixed(2),
        sgst: itcSGST.toFixed(2),
        cess: '0.00',
      },
      net_itc_available: {
        igst: itcIGST.toFixed(2),
        cgst: itcCGST.toFixed(2),
        sgst: itcSGST.toFixed(2),
        cess: '0.00',
      },
    },
    net_tax_payable: {
      igst: netIGST.toFixed(2),
      cgst: netCGST.toFixed(2),
      sgst: netSGST.toFixed(2),
      cess: '0.00',
      total: netTotal.toFixed(2),
    },
  };

  return {
    gstr1,
    gstr3b,
    netTaxPayable: {
      cgst: netCGST.toFixed(2),
      sgst: netSGST.toFixed(2),
      igst: netIGST.toFixed(2),
      total: netTotal.toFixed(2),
    },
  };
}
