import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, logAuditEventServer } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from '@/lib/validation/schemas';
import { extractInvoiceDocument } from '@/lib/documents/ocr-processor';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    const supabase = await createClient();

    if (documentId) {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('shop_id', ctx.shop.id)
        .single();

      if (docError || !doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Generate secure short-lived signed URL for private tenant file download
      let signedUrl = null;
      if (doc.storage_path) {
        const { data: urlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.storage_path, 300); // 5 minutes validity
        signedUrl = urlData?.signedUrl || null;
      }

      return NextResponse.json({ document: doc, signedUrl });
    }

    // List recent shop documents
    const { data: docs, error: listError } = await supabase
      .from('documents')
      .select('*')
      .eq('shop_id', ctx.shop.id)
      .order('created_at', { ascending: false });

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    return NextResponse.json({ documents: docs || [] });
  } catch (err: any) {
    console.error('Error fetching documents:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch documents' }, { status: 500 });
  }
}

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
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.warn('Storage bucket upload notice:', uploadError.message);
    }

    // Read bytes for OCR extraction
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Initial persistence: status UPLOADED -> PROCESSING
    const { error: insertError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        shop_id: ctx.shop.id,
        uploader_id: ctx.userId,
        uploaded_by: ctx.userId,
        original_filename: file.name,
        file_size: file.size,
        content_type: file.type,
        storage_path: storagePath,
        document_type: documentType,
        processing_status: 'processing',
        extraction_attempts: 1,
      });

    if (insertError) {
      console.error('Failed to persist document initial metadata:', insertError);
    }

    // Execute OCR extraction
    const extractionResult = await extractInvoiceDocument(fileBuffer, file.type, file.name);

    // Update document record with extraction results
    const finalStatus = extractionResult.success ? 'validation_required' : 'failed';
    const { data: updatedDoc } = await supabase
      .from('documents')
      .update({
        processing_status: finalStatus,
        extracted_data: extractionResult.extractedData as any,
        last_extraction_error: extractionResult.error || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    await logAuditEventServer({
      shopId: ctx.shop.id,
      actorId: ctx.userId,
      action: 'document_uploaded',
      entityType: 'document',
      entityId: documentId,
      metadata: {
        file_name: file.name,
        size: file.size,
        path: storagePath,
        extraction_status: finalStatus,
        confidence: extractionResult.extractedData?.confidence || 0,
      },
    });

    return NextResponse.json({
      document: updatedDoc || {
        id: documentId,
        original_filename: file.name,
        storage_path: storagePath,
        processing_status: finalStatus,
        extracted_data: extractionResult.extractedData,
      },
      extraction: extractionResult,
      storagePath,
      success: true,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error handling document upload:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process document' }, { status: 500 });
  }
}
