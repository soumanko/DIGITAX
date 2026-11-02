/**
 * DIGITAX — OCR Service
 *
 * Orchestrates document OCR extraction using a provider-independent
 * architecture. When no OCR provider is configured, returns a truthful
 * "not available" result and requires manual processing.
 */

import {
  OCRProvider,
  OCRDocumentResult,
  OCRProcessingResult,
  ExtractedInvoice,
  OCRConfig,
  loadOCRConfig,
  OCR_CONFIDENCE_THRESHOLD,
  FIELD_CONFIDENCE_THRESHOLD,
} from './types';
import { createOCRProvider } from './provider';

/**
 * Process a document through OCR.
 *
 * Steps:
 * 1. Load OCR configuration from environment
 * 2. Create the appropriate OCR provider
 * 3. Extract text from the document
 * 4. Normalize to structured invoice data (best-effort)
 * 5. Determine if human review is needed
 * 6. Return processing result
 *
 * If no OCR provider is configured, returns a result with
 * processingStatus: 'uploaded' and requiresHumanReview: true,
 * indicating manual processing is required.
 */
export async function processDocumentOCR(
  documentId: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<OCRProcessingResult> {
  const config = loadOCRConfig();
  const provider = createOCRProvider(config);

  // If no OCR provider is configured, return truthful result
  if (!provider.isAvailable()) {
    return {
      documentId,
      ocrResult: null,
      extractedInvoice: null,
      processingStatus: 'uploaded',
      error: 'No OCR provider configured. Manual processing required.',
      requiresHumanReview: true,
    };
  }

  try {
    // Run OCR extraction
    const ocrResult = await provider.extractDocument(fileBuffer, mimeType);

    // If OCR failed, return error
    if (ocrResult.error) {
      return {
        documentId,
        ocrResult,
        extractedInvoice: null,
        processingStatus: 'failed',
        error: ocrResult.error,
        requiresHumanReview: true,
      };
    }

    // Normalize OCR output to structured invoice data (best-effort)
    const extractedInvoice = normalizeOCRToInvoice(ocrResult);

    // Determine if human review is needed
    const requiresHumanReview =
      ocrResult.averageConfidence < OCR_CONFIDENCE_THRESHOLD ||
      (extractedInvoice ? extractedInvoice.needsReview : true);

    return {
      documentId,
      ocrResult,
      extractedInvoice: extractedInvoice ?? null,
      processingStatus: extractedInvoice ? 'extracted' : 'failed',
      error: extractedInvoice ? undefined : 'Failed to extract invoice data from OCR text',
      requiresHumanReview,
    };
  } catch (err) {
    return {
      documentId,
      ocrResult: null,
      extractedInvoice: null,
      processingStatus: 'failed',
      error: err instanceof Error ? err.message : 'OCR processing failed',
      requiresHumanReview: true,
    };
  }
}

/**
 * Normalize OCR document result to structured invoice data.
 * This is a best-effort rule-based extraction. It is not a substitute
 * for a trained OCR model and should always be reviewed by a human.
 */
function normalizeOCRToInvoice(ocrResult: OCRDocumentResult): ExtractedInvoice | null {
  const text = ocrResult.fullText;

  if (!text || text.trim().length < 10) {
    return null;
  }

  // Best-effort field extraction using regex patterns
  // These patterns are intentionally simple and may miss or misextract fields.
  // Human review is always required.

  const gstinMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/);
  const invoiceNumberMatch = text.match(/(?:invoice|bill|inv)[^\d]*(\d+[A-Z0-9/-]*)/i);
  const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/);
  const amountMatch = text.match(/(?:total|amount|balance)[^\d]*([\d,]+\.\d{2})/i);

  const supplierNameMatch = text.match(/^(?:supplier|vendor|from)[:\s]+(.+)$/im);
  const buyerNameMatch = text.match(/^(?:buyer|customer|to)[:\s]+(.+)$/im);

  const extracted: ExtractedInvoice = {
    supplierName: supplierNameMatch ? supplierNameMatch[1].trim() : null,
    supplierGSTIN: gstinMatch ? gstinMatch[0] : null,
    buyerName: buyerNameMatch ? buyerNameMatch[1].trim() : null,
    buyerGSTIN: null,
    invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1].trim() : null,
    invoiceDate: dateMatch ? dateMatch[1] : null,
    placeOfSupply: null,
    taxableValue: null,
    cgstAmount: null,
    sgstAmount: null,
    igstAmount: null,
    cessAmount: null,
    totalAmount: amountMatch ? amountMatch[1].replace(/,/g, '') : null,
    lineItems: [],
    confidence: ocrResult.averageConfidence,
    fieldConfidence: {},
    needsReview: true, // Always require review for OCR-extracted data
  };

  return extracted;
}
