import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { csrfMiddleware } from '@/lib/security/csrf';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';

/**
 * Account deletion (self-service) — POST /api/auth/account/delete
 *
 * Flow:
 *  1. Origin/Host CSRF verification + strict IP rate limiting (5/min).
 *  2. Authentication via the SSR cookie session (`auth.getUser()`).
 *  3. Typed confirmation (`confirmation === 'DELETE'`) — destructive action.
 *  4. Deterministic pre-check (read-only, service role): the frozen schema
 *     hard-blocks accounts whose activity is referenced by retained records:
 *       - audit_events rows authored by the user (actor_id ... CASCADE) or
 *         referencing their owned shops (shop_id ... SET NULL). Either
 *         cascaded action fires trg_prevent_audit_update/delete, which
 *         RAISEs 'Audit events are immutable and cannot be updated or
 *         deleted' and rolls the whole delete back.
 *       - import_batches rows created by the user (imported_by has NO
 *         ON DELETE action → plain FK violation on user delete).
 *     Accounts with such records are refused up front (HTTP 409) with an
 *     accurate explanation; only clean accounts reach the delete step
 *     (see docs/SUPPORT_ACCOUNT_DELETION_RUNBOOK.md for the human-authorized
 *     operation that clears retained records first).
 *  5. Captures the storage paths of documents belonging to the user's own
 *     shops BEFORE deletion (row data will be cascade-deleted with the shop
 *     rows, but storage objects are not).
 *  6. Deletes the Supabase auth user (service role, server-side only).
 *     The database schema cascades this into: profiles, shops (owner_id),
 *     shop_members and — through shop_id cascades — documents, invoices,
 *     invoice_items, transactions, reconciliation_matches, import_batches,
 *     filing_periods, gst_summaries and review_issues.
 *  7. On success, best-effort removes the captured storage objects.
 *
 * Note on audit_events: no NEW audit event is written here on purpose —
 * a new row would cascade away with actor_id, making the record self-deleting.
 */
export async function POST(request: NextRequest) {
  // CSRF protection (Origin/Host verification)
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userData.user.id;

    // Strict rate limit keyed by IP (like other sensitive auth mutations)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const rateLimit = rateLimiters.strict(`account-delete:${ip}:${userId}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // Typed destructive confirmation
    const body = await request.json().catch(() => null);
    if (!body || typeof body.confirmation !== 'string' || body.confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation required. Type DELETE to confirm account deletion.' },
        { status: 400 }
      );
    }

    const admin = createServiceClient();

    // 1) Deterministic pre-check: retained records that the frozen schema
    //    will refuse to cascade. Read-only — nothing is mutated here.
    const { data: ownedShops, error: shopsError } = await admin
      .from('shops')
      .select('id')
      .eq('owner_id', userId);

    if (shopsError) {
      console.error('Account deletion: could not load owned shops:', shopsError.message);
    }
    const shopIds = (ownedShops ?? []).map((s) => s.id as string);

    // Single query avoids double counting a row that is both authored by
    // the user and attached to one of their shops.
    let blockedAuditRecords = 0;
    let precheckFailed = false;
    if (shopIds.length > 0) {
      const { count, error } = await admin
        .from('audit_events')
        .select('id', { count: 'exact', head: true })
        .or(`actor_id.eq.${userId},shop_id.in.(${shopIds.join(',')})`);
      if (error) {
        precheckFailed = true;
        console.error('Account deletion: audit pre-check failed:', error.message);
      } else {
        blockedAuditRecords = count ?? 0;
      }
    } else {
      const { count, error } = await admin
        .from('audit_events')
        .select('id', { count: 'exact', head: true })
        .eq('actor_id', userId);
      if (error) {
        precheckFailed = true;
        console.error('Account deletion: audit pre-check failed:', error.message);
      } else {
        blockedAuditRecords = count ?? 0;
      }
    }

    let blockedImportBatches = 0;
    {
      const { count, error } = await admin
        .from('import_batches')
        .select('id', { count: 'exact', head: true })
        .eq('imported_by', userId);
      if (error) {
        precheckFailed = true;
        console.error('Account deletion: import-batch pre-check failed:', error.message);
      } else {
        blockedImportBatches = count ?? 0;
      }
    }

    if (!precheckFailed && (blockedAuditRecords > 0 || blockedImportBatches > 0)) {
      const reasons: string[] = [];
      if (blockedAuditRecords > 0) {
        reasons.push(
          `${blockedAuditRecords} immutable compliance audit ${blockedAuditRecords === 1 ? 'record' : 'records'}`
        );
      }
      if (blockedImportBatches > 0) {
        reasons.push(
          `${blockedImportBatches} import batch ${blockedImportBatches === 1 ? 'record' : 'records'}`
        );
      }
      return NextResponse.json(
        {
          error: `Your account cannot be deleted automatically because it is linked to ${reasons.join(' and ')} that the platform retains for compliance. Nothing was changed — your account and data remain intact. Contact support to close this account.`,
          code: 'ACCOUNT_DELETION_BLOCKED_BY_RECORDS',
        },
        { status: 409 }
      );
    }

    // 2) Snapshot the storage objects belonging to this user's own shops so
    //    they can be cleaned up after the atomic delete (rows will cascade;
    //    storage objects will not).
    let storagePaths: string[] = [];
    if (shopIds.length > 0) {
      const { data: docs, error: docsError } = await admin
        .from('documents')
        .select('storage_path')
        .in('shop_id', shopIds);
      if (!docsError && docs) {
        storagePaths = docs
          .map((d) => d.storage_path as string)
          .filter((p): p is string => Boolean(p));
      } else if (docsError) {
        console.error('Account deletion: could not load document paths:', docsError.message);
      }
    }

    // 3) Atomic deletion of the auth user — the DB schema cascades all tenant
    //    data. If this fails despite the clean pre-check (e.g. a race where a
    //    new audit row appeared between check and delete), NOTHING has been
    //    removed and the account stays intact.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Account deletion failed for user', userId, ':', deleteError.message);
      const raw = (deleteError.message || '').toLowerCase();
      const recordsBlocked =
        raw.includes('audit') ||
        raw.includes('immutable') ||
        raw.includes('violates foreign key') ||
        raw.includes('database error');
      return NextResponse.json(
        {
          error: recordsBlocked
            ? 'Your account cannot be deleted automatically because records tied to your activity are retained for compliance. Nothing was deleted — your account and data remain intact. Contact support to close this account.'
            : 'Your account could not be deleted right now. Nothing was removed — your account and data remain intact. Please try again later or contact support.',
        },
        { status: 500 }
      );
    }

    // 4) Best-effort cleanup of now-orphaned storage objects (fails are only
    //    logged — the account is already gone at this point).
    if (storagePaths.length > 0) {
      try {
        await admin.storage.from('shop-documents').remove(storagePaths);
      } catch (storageError) {
        console.warn(
          'Account deletion: storage cleanup failed (orphaned objects possible):',
          storageError instanceof Error ? storageError.message : storageError
        );
      }
    }

    const response = NextResponse.json({ deleted: true });
    // Ensure no tenant selection or demo state survives in this browser.
    response.cookies.set('dx_active_shop', '', { maxAge: 0, path: '/' });
    response.cookies.set('dx_demo_session', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Account deletion unexpected error:', err);
    return NextResponse.json(
      {
        error:
          'Your account could not be deleted right now. Nothing was removed — your account and data remain intact. Please try again later or contact support.',
      },
      { status: 500 }
    );
  }
}
