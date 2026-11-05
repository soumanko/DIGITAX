import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';

/**
 * GET /api/documents/[id]/signed-url
 * Generates a short-lived signed URL for secure document viewing/downloading.
 * Enforces multi-tenant isolation — only documents belonging to the user's shop
 * can be accessed. Never returns permanent public links.
 *
 * Query params:
 *   - download: if 'true', sets Content-Disposition: attachment
 *   - expiresIn: signed URL expiry in seconds (default: 900 = 15 min, max: 3600 = 1 hour)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId || !ctx.shop) {
      return NextResponse.json({ error: 'Authentication and active shop required' }, { status: 401 });
    }

    // Rate limit signed URL generation: 60 per minute per shop (relaxed)
    const rateLimit = rateLimiters.relaxed(`document-signed-url:${ctx.shop.id}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const { id: documentId } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';
    const expiresIn = Math.min(
      parseInt(searchParams.get('expiresIn') || '900', 10),
      3600,
    );

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch document metadata with shop isolation
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('shop_id', ctx.shop.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.storage_path) {
      return NextResponse.json({ error: 'Document storage path not found' }, { status: 404 });
    }

    // Use service client to generate signed URL (bypasses RLS for storage, but
    // we've already verified shop membership above)
    const serviceSupabase = createServiceClient();

    const { data: signedUrlData, error: signedUrlError } = await serviceSupabase.storage
      .from('shop-documents')
      .createSignedUrl(document.storage_path, expiresIn, {
        download,
      });

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      expiresIn,
      download,
      document: {
        id: document.id,
        originalFilename: document.original_filename,
        contentType: document.content_type,
        fileSize: document.file_size,
        processingStatus: document.processing_status,
      },
    });
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}