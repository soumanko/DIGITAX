/**
 * DIGITAX — OCR Provider Types and Interfaces
 *
 * Provider-independent OCR architecture. Separates document storage,
 * OCR extraction, normalization, validation, human review, and invoice
 * persistence into distinct layers.
 */

// ============================================
// OCR Provider Types
// ============================================

export type OCRProviderName = 'tesseract-local' | 'google-vision' | 'azure-ai' | 'none';

export interface OCRConfig {
  provider: OCRProviderName;
  apiKey?: string;
  apiUrl?: string;
  enabled: boolean;
}

export interface OCRPageResult {
  pageNumber: number;
  text: string;
  confidence: number; // 0 to 1
  wordBoxes: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
}

export interface OCRDocumentResult {
  documentId: string;
  totalPages: number;
  fullText: string;
  averageConfidence: number;
  pages: OCRPageResult[];
  provider: OCRProviderName;
  processedAt: string;
  error?: string;
}

// ============================================
// Extracted Invoice Data
// ============================================

export interface ExtractedInvoice {
  supplierName: string | null;
  supplierGSTIN: string | null;
  buyerName: string | null;
  buyerGSTIN: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  placeOfSupply: string | null;
  taxableValue: string | null;
  cgstAmount: string | null;
  sgstAmount: string | null;
  igstAmount: string | null;
  cessAmount: string | null;
  totalAmount: string | null;
  lineItems: Array<{
    description: string;
    hsnSacCode: string | null;
    quantity: string | null;
    unitPrice: string | null;
    taxableValue: string | null;
    gstRate: string | null;
    cgstAmount: string | null;
    sgstAmount: string | null;
    igstAmount: string | null;
    totalAmount: string | null;
  }>;
  confidence: number; // Overall extraction confidence 0 to 1
  fieldConfidence: Record<string, number>; // Per-field confidence
  needsReview: boolean; // True if any field is below confidence threshold
}

// ============================================
// OCR Provider Interface
// ============================================

export interface OCRProvider {
  name: OCRProviderName;
  isAvailable(): boolean;
  extractDocument(fileBuffer: Buffer, mimeType: string): Promise<OCRDocumentResult>;
}

// ============================================
// OCR Processing Result
// ============================================

export interface OCRProcessingResult {
  documentId: string;
  ocrResult: OCRDocumentResult | null;
  extractedInvoice: ExtractedInvoice | null;
  processingStatus: 'uploaded' | 'queued' | 'processing' | 'extracted' | 'failed' | 'manual_entry';
  error?: string;
  requiresHumanReview: boolean;
}

// ============================================
// Configuration
// ============================================

export const OCR_CONFIDENCE_THRESHOLD = 0.85;
export const FIELD_CONFIDENCE_THRESHOLD = 0.80;

// Default configuration — no OCR provider configured
export const DEFAULT_OCR_CONFIG: OCRConfig = {
  provider: 'none',
  enabled: false,
};

// Load OCR configuration from environment
export function loadOCRConfig(): OCRConfig {
  const provider = (process.env.OCR_PROVIDER as OCRProviderName) || 'none';
  const enabled = provider !== 'none' && !!process.env.OCR_PROVIDER;

  return {
    provider,
    apiKey: process.env.GOOGLE_VISION_API_KEY || process.env.AZURE_AI_KEY,
    apiUrl: process.env.GOOGLE_VISION_API_KEY
      ? 'https://vision.googleapis.com/v1/images:annotate'
      : process.env.AZURE_AI_ENDPOINT,
    enabled,
  };
}
