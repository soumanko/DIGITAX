import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

/**
 * Validate Indian GSTIN format (15-character alphanumeric).
 * Format: 2-digit state code + 10-digit PAN + entity number + Z + checksum
 */
export const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GSTIN format. Expected: 2-digit state code + PAN + entity + Z + checksum'
  );

export const optionalGstinSchema = z.union([
  gstinSchema,
  z.literal(''),
  z.null(),
]).optional();

/**
 * Decimal string validator for monetary values.
 */
export const moneyStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'Invalid monetary value')
  .refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num);
    },
    'Must be a valid number'
  );

export const positiveMoneySchema = moneyStringSchema.refine(
  (val) => parseFloat(val) >= 0,
  'Amount must be non-negative'
);

/**
 * Indian state codes (used in GSTIN and Place of Supply).
 */
export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

export const stateCodeSchema = z
  .string()
  .length(2)
  .refine((val) => val in INDIAN_STATE_CODES, 'Invalid state code');

// ============================================
// Auth Schemas
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  preferred_language: z.enum(['en', 'hi', 'bn', 'mr']).default('en'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

// ============================================
// Shop Schemas
// ============================================

export const createShopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters').max(200),
  business_type: z.string().max(100).optional(),
  gstin: optionalGstinSchema,
  gst_registration_type: z
    .enum(['regular', 'composition', 'unregistered', 'input_service_distributor', 'casual_taxable', 'non_resident'])
    .optional(),
  taxpayer_scheme: z
    .enum(['regular', 'composition_goods', 'composition_services', 'qrmp'])
    .optional(),
  address_line1: z.string().max(500).optional(),
  address_line2: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  state_code: stateCodeSchema.optional(),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid PIN code').optional(),
  phone: z.string().max(15).optional(),
  email: z.string().email().optional(),
  preferred_language: z.enum(['en', 'hi', 'bn', 'mr']).default('en'),
});

export const updateShopSchema = createShopSchema.partial();

// ============================================
// Document Schemas
// ============================================

export const ALLOWED_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadDocumentSchema = z.object({
  document_type: z.enum([
    'sales_invoice',
    'purchase_invoice',
    'credit_note',
    'debit_note',
    'receipt',
    'other',
  ]),
});

// ============================================
// Invoice Schemas
// ============================================

export const invoiceLineSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hsn_sac_code: z.string().max(8).optional(),
  quantity: positiveMoneySchema.optional(),
  unit: z.string().max(20).optional(),
  unit_price: positiveMoneySchema.optional(),
  discount: positiveMoneySchema.default('0'),
  taxable_value: positiveMoneySchema,
  gst_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid GST rate'),
  cgst_amount: positiveMoneySchema.default('0'),
  sgst_amount: positiveMoneySchema.default('0'),
  igst_amount: positiveMoneySchema.default('0'),
  cess_amount: positiveMoneySchema.default('0'),
  total_amount: positiveMoneySchema,
});

export const confirmInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  direction: z.enum(['sales', 'purchase']),
  supplier_name: z.string().optional(),
  supplier_gstin: optionalGstinSchema,
  buyer_name: z.string().optional(),
  buyer_gstin: optionalGstinSchema,
  place_of_supply_state_code: stateCodeSchema.optional(),
  is_inter_state: z.boolean().optional(),
  subtotal: positiveMoneySchema,
  discount_total: positiveMoneySchema.default('0'),
  taxable_value: positiveMoneySchema,
  cgst_total: positiveMoneySchema.default('0'),
  sgst_total: positiveMoneySchema.default('0'),
  igst_total: positiveMoneySchema.default('0'),
  cess_total: positiveMoneySchema.default('0'),
  total_amount: positiveMoneySchema,
  notes: z.string().max(1000).optional(),
  lines: z.array(invoiceLineSchema).min(1, 'At least one line item is required'),
});

// ============================================
// Transaction & Import Schemas
// ============================================

export const transactionCategorySchema = z.enum([
  'business_sale',
  'business_purchase',
  'supplier_payment',
  'customer_receipt',
  'refund',
  'bank_transfer',
  'loan_borrowing',
  'owner_contribution',
  'owner_withdrawal',
  'personal',
  'cash_entry',
  'unknown',
]);

export const updateTransactionSchema = z.object({
  category: transactionCategorySchema.optional(),
  review_state: z.enum(['pending_review', 'confirmed', 'corrected', 'rejected', 'needs_clarification']).optional(),
  notes: z.string().max(1000).optional(),
});

export const csvColumnMappingSchema = z.object({
  date_column: z.string().min(1),
  description_column: z.string().min(1),
  amount_column: z.string().optional(),
  credit_column: z.string().optional(),
  debit_column: z.string().optional(),
  reference_column: z.string().optional(),
  date_format: z.string().default('DD/MM/YYYY'),
});

// ============================================
// Reconciliation Schemas
// ============================================

export const confirmMatchSchema = z.object({
  transaction_id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  allocated_amount: positiveMoneySchema,
});

export const rejectMatchSchema = z.object({
  match_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

// ============================================
// Assistant Schemas
// ============================================

export const assistantMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  shop_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
});

// ============================================
// Export Types
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type ConfirmInvoiceInput = z.infer<typeof confirmInvoiceSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CsvColumnMapping = z.infer<typeof csvColumnMappingSchema>;
export type ConfirmMatchInput = z.infer<typeof confirmMatchSchema>;
export type AssistantMessageInput = z.infer<typeof assistantMessageSchema>;
