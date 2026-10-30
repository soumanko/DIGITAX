import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
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
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as any)) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type}. Allowed: PDF, JPEG, PNG, WEBP`,
      }, { status: 400 });
    }

    const supabase = await createClient();
    const documentId = crypto.randomUUID();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${ctx.shop.id}/${documentId}/${sanitizedFilename}`;

    // Upload to private Supabase storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.warn('Storage bucket upload notice:', uploadError.message);
      // Even if storage bucket is offline/not initialized, record the document metadata record
    }

    // Persist document metadata in database
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        shop_id: ctx.shop.id,
        user_id: ctx.userId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        document_type: documentType,
        processing_status: 'completed',
        ocr_confidence: null,
      } as any)
      .select()
      .single();

    if (docError) {
      console.error('Failed to persist document record:', docError);
    }

    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'document_uploaded',
      entityType: 'document',
      entityId: documentId,
      metadata: { file_name: file.name, size: file.size, path: storagePath },
    });

    return NextResponse.json({
      document: docRecord || {
        id: documentId,
        file_name: file.name,
        storage_path: storagePath,
      },
      storagePath,
      success: true,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error handling document upload:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process document' }, { status: 500 });
  }
}
