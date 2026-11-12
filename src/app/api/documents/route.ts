import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from '@/lib/validation/schemas';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

/**
 * GET /api/documents
 * Lists document metadata for the authenticated user's active shop.
 * Enforces multi-tenant isolation — only documents belonging to the user's shop are returned.
 *
 * Query params:
 *   - limit: max number of documents to return (default: 50, max: 100)
 *   - offset: number of documents to skip (default: 0)
 *   - document_type: filter by document type
 *   - processing_status: filter by processing status
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit document reads: 100 per minute per shop (relaxed)
    const rateLimit = rateLimiters.relaxed(`document-list:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const documentType = searchParams.get('document_type') || undefined;
    const processingStatus = searchParams.get('processing_status') || undefined;

    const supabase = await createClient();

    let query = supabase
      .from('documents')
      .select('*')
      .eq('shop_id', ctx.shop.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    if (processingStatus) {
      query = query.eq('processing_status', processingStatus);
    }

    const { data: documents, error, count } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      documents: documents || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (documents || []).length,
    }, { status: 200 });
  } catch (err) {
    console.error('Error fetching documents:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/documents
 * Uploads a document file to private Supabase Storage and persists metadata.
 * Enforces multi-tenant isolation — documents are scoped to the user's shop.
 *
 * Rate limited: 30 uploads per minute per shop (moderate).
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit document upload: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`document-upload:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('document_type') as string) || 'purchase_invoice';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate size limit (10MB)
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate mime type
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as typeof ALLOWED_DOCUMENT_TYPES[number])) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type}. Allowed: PDF, JPEG, PNG, WEBP`,
      }, { status: 400 });
    }

    const supabase = await createClient();
    const documentId = crypto.randomUUID();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${ctx.shop.id}/${documentId}/${sanitizedFilename}`;

    // Upload to private Supabase storage bucket (must match migration bucket name 'shop-documents')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('shop-documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage bucket upload error:', uploadError.message);
      return NextResponse.json(
        { error: 'Failed to upload document to storage' },
        { status: 500 },
      );
    }

    // Persist document metadata in database using correct schema columns
    // Schema columns: uploader_id, uploaded_by, original_filename, content_type, file_size, storage_path, document_type, processing_status
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        shop_id: ctx.shop.id,
        uploader_id: ctx.userId,
        uploaded_by: ctx.userId,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        document_type: documentType,
        processing_status: 'uploaded',
      })
      .select()
      .single();

    if (docError) {
      console.error('Failed to persist document record:', docError);
      // Attempt to clean up the uploaded file
      await supabase.storage.from('shop-documents').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to persist document record' }, { status: 500 });
    }

    // Log immutable audit event
    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'document_uploaded',
      entityType: 'document',
      entityId: documentId,
      metadata: { file_name: file.name, size: file.size, path: storagePath, document_type: documentType },
    });

    return NextResponse.json({
      document: docRecord,
      storagePath,
      success: true,
    }, { status: 201 });
  } catch (err) {
    console.error('Error handling document upload:', err);
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]
 * Deletes a document record and its storage object.
 * Enforces multi-tenant isolation — only documents belonging to the user's shop can be deleted.
 *
 * Rate limited: 30 deletes per minute per shop (moderate).
 */
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit document deletion: 30 per minute per shop (moderate)
    const rateLimit = rateLimiters.moderate(`document-delete:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch document metadata for authorization and storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('shop_id', ctx.shop.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    if (document.storage_path) {
      await supabase.storage.from('shop-documents').remove([document.storage_path]);
    }

    // Delete metadata record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('shop_id', ctx.shop.id);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log audit event
    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'document_deleted',
      entityType: 'document',
      entityId: documentId,
      metadata: { file_name: document.original_filename, path: document.storage_path },
    });

    return NextResponse.json({ success: true, message: 'Document deleted' }, { status: 200 });
  } catch (err) {
    console.error('Error deleting document:', err);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
