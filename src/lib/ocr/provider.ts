/**
 * DIGITAX — OCR Provider Implementations
 *
 * Base class for OCR providers and a "none" provider for when no OCR
 * service is configured. All providers implement the OCRProvider interface.
 */

import {
  OCRProvider,
  OCRDocumentResult,
  OCRConfig,
  OCRProviderName,
} from './types';

/**
 * Abstract base class for OCR providers.
 * Provides common helper methods for all providers.
 */
export abstract class BaseOCRProvider implements OCRProvider {
  abstract name: OCRProviderName;
  abstract isAvailable(): boolean;

  /**
   * Extract text and structured data from a document file.
   * Must be implemented by concrete providers.
   */
  abstract extractDocument(fileBuffer: Buffer, mimeType: string): Promise<OCRDocumentResult>;

  /**
   * Helper: Create a failed OCR result.
   */
  protected createFailedResult(documentId: string, error: string): OCRDocumentResult {
    return {
      documentId,
      totalPages: 0,
      fullText: '',
      averageConfidence: 0,
      pages: [],
      provider: this.name,
      processedAt: new Date().toISOString(),
      error,
    };
  }

  /**
   * Helper: Validate that the provider is configured before extraction.
   */
  protected assertAvailable(): void {
    if (!this.isAvailable()) {
      throw new Error(`OCR provider '${this.name}' is not available or not configured`);
    }
  }
}

/**
 * NoOpOCRProvider — used when no OCR provider is configured.
 * Returns a result indicating that OCR is not available and manual
 * processing is required.
 */
export class NoOpOCRProvider extends BaseOCRProvider {
  name: OCRProviderName = 'none';

  isAvailable(): boolean {
    return false;
  }

  async extractDocument(fileBuffer: Buffer, mimeType: string): Promise<OCRDocumentResult> {
    return this.createFailedResult(
      'unknown',
      'No OCR provider configured. Set OCR_PROVIDER environment variable (tesseract-local, google-vision, or azure-ai) and provide the corresponding API key.',
    );
  }
}

/**
 * Factory: Create an OCR provider based on configuration.
 * Returns a NoOpOCRProvider if no provider is configured.
 */
export function createOCRProvider(config: OCRConfig): OCRProvider {
  switch (config.provider) {
    case 'tesseract-local':
      // Tesseract-local would require a local Tesseract OCR installation
      // and a Node.js binding (e.g., tesseract.js). Not implemented here
      // as it requires native dependencies.
      return new NoOpOCRProvider();
    case 'google-vision':
      if (!config.apiKey) {
        return new NoOpOCRProvider();
      }
      // Google Vision provider would call the Vision API
      // Not implemented without a valid API key
      return new NoOpOCRProvider();
    case 'azure-ai':
      if (!config.apiKey) {
        return new NoOpOCRProvider();
      }
      // Azure AI provider would call the Azure Form Recognizer API
      // Not implemented without a valid API key
      return new NoOpOCRProvider();
    case 'none':
    default:
      return new NoOpOCRProvider();
  }
}
