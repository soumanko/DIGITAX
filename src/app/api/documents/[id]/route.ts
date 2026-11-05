import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedContext, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';
import { z } from 'zod';

/**
 * PATCH /api/documents/[id]
 * Updates document metadata (processing status, document type, etc.).
 * Enforces multi-tenant isolation.
 *
 * Body:
 *   - processing_status: 'uploaded' | 'processing' | 'ocr_completed' | 'pending_review' | 'error'
 *   - document_type: string
 *   - extracted_data: JSON object (OCR extraction results)
 *   - confidence_score: number (0-100)
 */
const updateDocumentSchema = z.object({
  processing_status: z
    .enum(['uploaded', 'processing', 'ocr_completed', 'pending_review', 'error'])
    .optional(),
  document_type: z.string().optional(),
  extracted_data: z.record(z.string(), z.any()).optional(),
  confidence_score: z.number().min(0).max(100).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit document updates: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`document-update:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const validated = updateDocumentSchema.parse(body);

    const supabase = await createClient();

    // Verify document exists and belongs to shop
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('shop_id', ctx.shop.id)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update document metadata
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({
        ...(validated.processing_status && { processing_status: validated.processing_status }),
        ...(validated.document_type && { document_type: validated.document_type }),
        ...(validated.extracted_data && { extracted_data: validated.extracted_data }),
        ...(validated.confidence_score !== undefined && { confidence_score: validated.confidence_score }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('shop_id', ctx.shop.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log audit event
    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'document_updated',
      entityType: 'document',
      entityId: documentId,
      metadata: {
        fields: Object.keys(validated),
        processingStatus: validated.processing_status,
      },
    });

    return NextResponse.json({
      document: updatedDoc,
      success: true,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 },
      );
    }
    console.error('Error updating document:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}