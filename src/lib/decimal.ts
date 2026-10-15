import Decimal from 'decimal.js';

// Configure decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 21,
});

/**
 * Create a Decimal from a string or number value.
 * Always use this instead of raw floating-point for financial calculations.
 */
export function money(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Format a Decimal as INR string with 2 decimal places.
 */
export function formatINR(value: string | number | Decimal): string {
  const d = new Decimal(value);
  // Indian numbering system: xx,xx,xxx.xx
  const parts = d.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];
  
  const isNegative = intPart.startsWith('-');
  const absInt = isNegative ? intPart.slice(1) : intPart;
  
  let formatted: string;
  if (absInt.length <= 3) {
    formatted = absInt;
  } else {
    // Last 3 digits
    const last3 = absInt.slice(-3);
    // Remaining digits grouped in pairs
    const remaining = absInt.slice(0, -3);
    const pairs = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = `${pairs},${last3}`;
  }
  
  return `${isNegative ? '-' : ''}₹${formatted}.${decPart}`;
}

/**
 * Round to 2 decimal places using ROUND_HALF_UP (standard for Indian GST).
 */
export function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Calculate GST components for a given taxable value and rate.
 * Returns CGST + SGST for intra-state, IGST for inter-state.
 */
export function calculateGSTComponents(
  taxableValue: Decimal,
  gstRate: Decimal,
  isInterState: boolean
): {
  cgst: Decimal;
  sgst: Decimal;
  igst: Decimal;
  totalTax: Decimal;
} {
  const totalTax = roundMoney(taxableValue.mul(gstRate).div(100));
  
  if (isInterState) {
    return {
      cgst: new Decimal(0),
      sgst: new Decimal(0),
      igst: totalTax,
      totalTax,
    };
  }
  
  // Intra-state: split equally between CGST and SGST
  const halfRate = gstRate.div(2);
  const cgst = roundMoney(taxableValue.mul(halfRate).div(100));
  const sgst = roundMoney(taxableValue.mul(halfRate).div(100));
  
  return {
    cgst,
    sgst,
    igst: new Decimal(0),
    totalTax: cgst.plus(sgst),
  };
}

/**
 * Validate that line items sum to the invoice total within tolerance.
 */
export function validateInvoiceArithmetic(
  lineItems: Array<{ taxableValue: string; totalAmount: string }>,
  invoiceTaxableValue: string,
  invoiceTotalAmount: string,
  toleranceINR: number = 1 // ₹1 tolerance for rounding
): { valid: boolean; taxableDifference: Decimal; totalDifference: Decimal } {
  const sumTaxable = lineItems.reduce(
    (sum, item) => sum.plus(new Decimal(item.taxableValue)),
    new Decimal(0)
  );
  const sumTotal = lineItems.reduce(
    (sum, item) => sum.plus(new Decimal(item.totalAmount)),
    new Decimal(0)
  );
  
  const taxableDiff = new Decimal(invoiceTaxableValue).minus(sumTaxable).abs();
  const totalDiff = new Decimal(invoiceTotalAmount).minus(sumTotal).abs();
  const tolerance = new Decimal(toleranceINR);
  
  return {
    valid: taxableDiff.lte(tolerance) && totalDiff.lte(tolerance),
    taxableDifference: taxableDiff,
    totalDifference: totalDiff,
  };
}

export { Decimal };
