import Decimal from 'decimal.js';
import { money, roundMoney } from '../decimal';
import { Invoice, GSTR1Summary, GSTR3BSummary, GSTPeriodSummary } from '../../types';

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
 * Validates 15-character Indian GSTIN with state code prefix
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
 * Generate GSTR-1 and GSTR-3B period summaries from a list of invoices
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
  calculationVersion: string;
  rulesetVersion: string;
} {
  // Filter invoices for the requested period using proper date parsing
  const periodYearStr = String(periodYear);
  const periodMonthStr = String(periodMonth).padStart(2, '0');
  const periodStr = `${periodYearStr}-${periodMonthStr}`;
  const periodStart = `${periodYearStr}-${periodMonthStr}-01`;
  const periodEnd = `${periodYearStr}-${periodMonthStr}-31`;
  const periodInvoices = invoices.filter((inv) => {
    const invDate = inv.invoice_date;
    if (!invDate || typeof invDate !== 'string') return false;
    // Compare as ISO date strings (YYYY-MM-DD format is lexicographically comparable)
    return invDate >= periodStart && invDate <= periodEnd;
  });

  // GSTR-1: Outward Supplies (Sales)
  const salesInvoices = periodInvoices.filter(inv => inv.invoice_type === 'sales_tax_invoice');

  let b2bTaxable = money(0);
  let b2bCGST = money(0);
  let b2bSGST = money(0);
  let b2bIGST = money(0);
  let b2bCount = 0;

  let b2cTaxable = money(0);
  let b2cCGST = money(0);
  let b2cSGST = money(0);
  let b2cIGST = money(0);
  let b2cCount = 0;

  for (const inv of salesInvoices) {
    const cgstVal = inv.cgst_amount || inv.cgst_total || '0.00';
    const sgstVal = inv.sgst_amount || inv.sgst_total || '0.00';
    const igstVal = inv.igst_amount || inv.igst_total || '0.00';

    if (inv.customer_gstin || inv.buyer_gstin) {
      // B2B Supply
      b2bCount++;
      b2bTaxable = b2bTaxable.plus(money(inv.taxable_value));
      b2bCGST = b2bCGST.plus(money(cgstVal));
      b2bSGST = b2bSGST.plus(money(sgstVal));
      b2bIGST = b2bIGST.plus(money(igstVal));
    } else {
      // B2C Supply (Retail counter sales)
      b2cCount++;
      b2cTaxable = b2cTaxable.plus(money(inv.taxable_value));
      b2cCGST = b2cCGST.plus(money(cgstVal));
      b2cSGST = b2cSGST.plus(money(sgstVal));
      b2cIGST = b2cIGST.plus(money(igstVal));
    }
  }

  // GSTR-3B: Inward Supplies (Input Tax Credit / Purchases)
  const purchaseInvoices = periodInvoices.filter(inv => inv.direction === 'purchase' || inv.invoice_type === 'purchase_tax_invoice');

  let itcTaxable = money(0);
  let itcCGST = money(0);
  let itcSGST = money(0);
  let itcIGST = money(0);

  for (const inv of purchaseInvoices) {
    const cgstVal = inv.cgst_amount || inv.cgst_total || '0.00';
    const sgstVal = inv.sgst_amount || inv.sgst_total || '0.00';
    const igstVal = inv.igst_amount || inv.igst_total || '0.00';

    itcTaxable = itcTaxable.plus(money(inv.taxable_value));
    itcCGST = itcCGST.plus(money(cgstVal));
    itcSGST = itcSGST.plus(money(sgstVal));
    itcIGST = itcIGST.plus(money(igstVal));
  }

  // Total Outward Tax Liability
  const totalOutwardCGST = b2bCGST.plus(b2cCGST);
  const totalOutwardSGST = b2bSGST.plus(b2cSGST);
  const totalOutwardIGST = b2bIGST.plus(b2cIGST);
  const totalOutwardTax = totalOutwardCGST.plus(totalOutwardSGST).plus(totalOutwardIGST);

  // Total Inward Eligible ITC
  const totalITC = itcCGST.plus(itcSGST).plus(itcIGST);

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
      invoices: salesInvoices.filter(i => !!i.customer_gstin),
    },
    b2c_large: {
      invoiceCount: 0,
      taxableValue: '0.00',
      igst: '0.00',
      totalTax: '0.00',
    },
    b2c_small: {
      taxableValue: b2cTaxable.toFixed(2),
      cgst: b2cCGST.toFixed(2),
      sgst: b2cSGST.toFixed(2),
      igst: b2cIGST.toFixed(2),
      totalTax: b2cCGST.plus(b2cSGST).plus(b2cIGST).toFixed(2),
    },
    credit_debit_notes: {
      count: 0,
      taxableValue: '0.00',
      totalTax: '0.00',
    },
    hsn_summary: [],
    totalTaxableValue: b2bTaxable.plus(b2cTaxable).toFixed(2),
    totalTax: totalOutwardTax.toFixed(2),
  };

  const gstr3b: GSTR3BSummary = {
    period: periodStr,
    outward_supplies: {
      taxableValue: b2bTaxable.plus(b2cTaxable).toFixed(2),
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
    calculationVersion: '1.0.0',
    rulesetVersion: '1.0.0',
  };
}

/**
 * Composition Scheme GST Calculation
 *
 * Composition scheme taxpayers pay a fixed percentage of turnover as tax
 * (e.g., 1% for manufacturers, 5% for restaurants, 6% for other service providers
 * under the special composition scheme). They cannot claim ITC and cannot issue
 * tax invoices - they issue bills of supply instead.
 *
 * GST rates for composition scheme (as of current rules):
 * - Manufacturers and traders: 1% (0.5% CGST + 0.5% SGST intra-state, 1% IGST inter-state)
 * - Restaurants (not serving alcohol): 5% (2.5% CGST + 2.5% SGST intra-state, 5% IGST inter-state)
 * - Other service providers (special scheme): 6% (3% CGST + 3% SGST intra-state, 6% IGST inter-state)
 *
 * Eligibility: Aggregate turnover up to Rs. 1.5 crore (Rs. 75 lakh for special category states)
 */
export const COMPOSITION_SCHEMES = {
  manufacturer: { id: 'manufacturer', name: 'Manufacturer/Trader', rate: 1, turnoverLimit: 15000000 },
  restaurant: { id: 'restaurant', name: 'Restaurant (non-alcohol)', rate: 5, turnoverLimit: 15000000 },
  serviceProvider: { id: 'service_provider', name: 'Service Provider (6% scheme)', rate: 6, turnoverLimit: 5000000 },
} as const;

export type CompositionSchemeId = keyof typeof COMPOSITION_SCHEMES;

/**
 * Check if a business is eligible for composition scheme based on turnover.
 */
export function isCompositionEligible(turnover: string, stateCategory: 'normal' | 'special' = 'normal'): boolean {
  const turnoverAmount = money(turnover);
  const limit = stateCategory === 'special' ? money(7500000) : money(15000000);
  return turnoverAmount.lessThanOrEqualTo(limit);
}

/**
 * Calculate tax under composition scheme.
 * Composition dealers pay tax on turnover (not taxable value), cannot claim ITC.
 */
export function calculateCompositionTax(
  turnoverAmount: string | number | Decimal,
  schemeId: CompositionSchemeId,
  supplierStateCode: string,
  placeOfSupplyStateCode: string
): GSTCalculationResult {
  const turnover = money(turnoverAmount);
  const scheme = COMPOSITION_SCHEMES[schemeId];
  const rate = money(scheme.rate);
  const isInterState = supplierStateCode !== placeOfSupplyStateCode;

  const totalTax = roundMoney(turnover.mul(rate).div(100));

  if (isInterState) {
    return {
      taxableValue: turnover,
      cgst: money(0),
      sgst: money(0),
      igst: totalTax,
      cess: money(0),
      totalTax,
      totalInvoiceAmount: roundMoney(turnover.plus(totalTax)),
      isInterState: true,
    };
  }

  // Intra-state: split equally
  const halfRate = rate.div(2);
  const cgst = roundMoney(turnover.mul(halfRate).div(100));
  const sgst = roundMoney(turnover.mul(halfRate).div(100));

  return {
    taxableValue: turnover,
    cgst,
    sgst,
    igst: money(0),
    cess: money(0),
    totalTax: cgst.plus(sgst),
    totalInvoiceAmount: roundMoney(turnover.plus(cgst).plus(sgst)),
    isInterState: false,
  };
}

/**
 * Reverse Charge Mechanism (RCM) Calculation
 *
 * Under RCM, the recipient (buyer) is liable to pay GST instead of the supplier.
 * Applicable for:
 * - Goods/services from unregistered suppliers to registered recipients
 * - Specific notified goods (e.g., cashew nuts, tobacco leaves)
 * - Specific notified services (e.g., GTA, legal services, sponsorship)
 *
 * The recipient self-invoices and pays both CGST+SGST (intra-state) or IGST (inter-state).
 * The recipient can claim ITC on the RCM tax paid (subject to eligibility).
 */
export interface RCMCalculationResult {
  taxableValue: Decimal;
  cgst: Decimal;
  sgst: Decimal;
  igst: Decimal;
  cess: Decimal;
  totalTax: Decimal;
  totalAmount: Decimal;
  isInterState: boolean;
  rcmApplicable: boolean;
  rcmReason: string;
}

/**
 * Determine if reverse charge applies and calculate tax.
 * The caller must specify whether RCM applies based on notified goods/services list.
 * DIGITAX does not auto-determine RCM applicability — the user must confirm.
 */
export function calculateRCMTax(
  taxableAmount: string | number | Decimal,
  ratePercentage: string | number | Decimal,
  supplierStateCode: string,
  placeOfSupplyStateCode: string,
  rcmApplicable: boolean,
  rcmReason: string = 'Notified supply under reverse charge'
): RCMCalculationResult {
  const taxable = money(taxableAmount);
  const rate = money(ratePercentage);
  const isInterState = supplierStateCode !== placeOfSupplyStateCode;

  if (!rcmApplicable) {
    // Normal forward charge - use standard calculation
    const result = calculateTaxComponents(taxableAmount, ratePercentage, supplierStateCode, placeOfSupplyStateCode);
    return {
      taxableValue: result.taxableValue,
      cgst: result.cgst,
      sgst: result.sgst,
      igst: result.igst,
      cess: result.cess,
      totalTax: result.totalTax,
      totalAmount: result.totalInvoiceAmount,
      isInterState: result.isInterState,
      rcmApplicable: false,
      rcmReason: 'Reverse charge not applicable',
    };
  }

  // RCM applies - recipient pays tax
  let totalTax: Decimal;
  let cgst: Decimal;
  let sgst: Decimal;
  let igst: Decimal;

  if (isInterState) {
    totalTax = roundMoney(taxable.mul(rate).div(100));
    cgst = money(0);
    sgst = money(0);
    igst = totalTax;
  } else {
    const halfRate = rate.div(2);
    cgst = roundMoney(taxable.mul(halfRate).div(100));
    sgst = roundMoney(taxable.mul(halfRate).div(100));
    igst = money(0);
    totalTax = cgst.plus(sgst);
  }

  return {
    taxableValue: taxable,
    cgst,
    sgst,
    igst,
    cess: money(0),
    totalTax,
    totalAmount: roundMoney(taxable.plus(totalTax)),
    isInterState,
    rcmApplicable: true,
    rcmReason,
  };
}

/**
 * Credit/Debit Note Calculation
 *
 * Credit Note: Issued by supplier when taxable value or tax charged needs to be reduced
 * (e.g., goods returned, post-sale discount, defective goods).
 * Debit Note: Issued by supplier when taxable value or tax charged needs to be increased
 * (e.g., undercharged, post-sale price increase).
 *
 * The note must reference the original invoice and adjust the tax liability accordingly.
 */
export interface CreditDebitNoteCalculation {
  noteType: 'credit_note' | 'debit_note';
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  taxableValueAdjustment: Decimal;
  cgstAdjustment: Decimal;
  sgstAdjustment: Decimal;
  igstAdjustment: Decimal;
  totalTaxAdjustment: Decimal;
  reason: string;
  gstr1Treatment: string;
}

/**
 * Calculate tax adjustments for credit/debit notes.
 * Credit notes reduce liability; debit notes increase liability.
 */
export function calculateCreditDebitNote(
  noteType: 'credit_note' | 'debit_note',
  taxableValueChange: string | number | Decimal,
  ratePercentage: string | number | Decimal,
  supplierStateCode: string,
  placeOfSupplyStateCode: string,
  originalInvoiceNumber: string,
  originalInvoiceDate: string,
  reason: string
): CreditDebitNoteCalculation {
  const change = money(taxableValueChange);
  const rate = money(ratePercentage);
  const isInterState = supplierStateCode !== placeOfSupplyStateCode;

  // Credit note: negative adjustment (reduction)
  // Debit note: positive adjustment (increase)
  const multiplier = noteType === 'credit_note' ? -1 : 1;
  const adjustedTaxable = change.mul(multiplier);

  let cgstAdj: Decimal;
  let sgstAdj: Decimal;
  let igstAdj: Decimal;

  if (isInterState) {
    cgstAdj = money(0);
    sgstAdj = money(0);
    igstAdj = roundMoney(adjustedTaxable.mul(rate).div(100));
  } else {
    const halfRate = rate.div(2);
    cgstAdj = roundMoney(adjustedTaxable.mul(halfRate).div(100));
    sgstAdj = roundMoney(adjustedTaxable.mul(halfRate).div(100));
    igstAdj = money(0);
  }

  const totalTaxAdj = cgstAdj.plus(sgstAdj).plus(igstAdj);

  const gstr1Treatment = noteType === 'credit_note'
    ? 'Credit note: reduces outward supply liability in GSTR-1'
    : 'Debit note: increases outward supply liability in GSTR-1';

  return {
    noteType,
    originalInvoiceNumber,
    originalInvoiceDate,
    taxableValueAdjustment: adjustedTaxable,
    cgstAdjustment: cgstAdj,
    sgstAdjustment: sgstAdj,
    igstAdjustment: igstAdj,
    totalTaxAdjustment: totalTaxAdj,
    reason,
    gstr1Treatment,
  };
}
