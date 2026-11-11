# Support Runbook — Closing an Account That Holds Retained Records

**Status: SUPPORT / OWNER-AUTHORIZED OPERATION — never executed by the application.**

The application's self-service deletion (`POST /api/auth/account/delete`) is hard-blocked by the
frozen database schema (`supabase/migrations/001_initial_schema.sql`) for any account that holds
retained records. The route detects this deterministically and returns HTTP 409 with a precise
explanation; **it never attempts a doomed delete**. Use this runbook only when the account owner
(or platform owner) has explicitly decided to close such an account.

## Why the hard block exists

Two frozen-schema constraints make the cascade-delete of an `auth.users` row fail — atomically,
with nothing removed:

1. **Immutable audit trail** — `audit_events` rows are protected by
   `trg_prevent_audit_update` / `trg_prevent_audit_delete`, which `RAISE EXCEPTION
   'Audit events are immutable and cannot be updated or deleted'` on ANY row UPDATE/DELETE.
   Deleting a user cascades into `audit_events` twice:
   - `actor_id … ON DELETE CASCADE` (rows the user authored) → row DELETE → trigger raises;
   - dropping a shop they own also re-points `audit_events.shop_id … ON DELETE SET NULL`
     → row UPDATE → trigger raises.
2. **`import_batches.imported_by`** references `auth.users(id)` with **no ON DELETE action**,
   so any import batch created by the user is a plain FK violation on user delete.

Both are compliance features, not bugs. Bypassing them app-side (or editing the frozen migrations)
is out of scope for application code.

## Preconditions (all checked by the application before this runbook is needed)

- Account identified (user id + email).
- `audit_events` count for `actor_id = <userId>` plus audit rows attached to shops owned by the user.
- `import_batches` count for `imported_by = <userId>`.

## Optional cleanup the app CAN do for itself

Before the DB step, the account's own documents can be removed from storage by the application
(path convention `{shop_id}/{document_id}/{filename}` in the private `shop-documents` bucket).
The deletion route does this best-effort after a successful delete; in this runbook flow storage
cleanup can also be done manually after the SQL step.

## Procedure (execute in the Supabase SQL editor, as table owner)

> This step **permanently removes the account's audit history** tied to them and their shops.
> That loss is exactly what the immutability triggers exist to prevent by accident — here it is a
> human-authorized decision. Record the who/why of this decision OUTSIDE the DB (support ticket),
> because no audit row can be written for it (any new row would cascade away with the user).

```sql
-- 1) Disable ONLY the two triggers for the duration of this operation.
ALTER TABLE public.audit_events DISABLE TRIGGER trg_prevent_audit_update;
ALTER TABLE public.audit_events DISABLE TRIGGER trg_prevent_audit_delete;

-- 2) Clear import batches created by the user — important: these rows cause a
--    separate FK violation (imported_by has NO ON DELETE action) that survives
--    the trigger disablement. No immutable triggers apply to this table.
DELETE FROM public.import_batches WHERE imported_by = '<userId>';

-- 3) Delete the auth user (idempotent guard: fails loudly if already gone).
SELECT id, email FROM auth.users WHERE id = '<userId>';  -- confirm identity first
DELETE FROM auth.users WHERE id = '<userId>';

-- 4) CASCADES APPLY: profiles, shops (owner_id), shop_members, documents,
--    invoices, invoice_items, transactions, reconciliation_matches,
--    import_batches (shop-scoped), filing_periods, gst_summaries,
--    review_issues, audit_events (actor_id rows + SET NULL rows during
--    the disabled window).

-- 5) Re-enable the triggers IMMEDIATELY. Do not run anything else between
--    steps 1 and 5.
ALTER TABLE public.audit_events ENABLE TRIGGER trg_prevent_audit_update;
ALTER TABLE public.audit_events ENABLE TRIGGER trg_prevent_audit_delete;

-- 6) Verify the account is gone and nothing consultable remains.
SELECT count(*) FROM auth.users WHERE id = '<userId>';             -- expect 0
SELECT count(*) FROM public.profiles WHERE id = '<userId>';        -- expect 0
SELECT count(*) FROM public.audit_events WHERE actor_id = '<userId>'; -- expect 0
```

## Post-steps

- Storage objects of the deleted shops can be removed listing
  `storage.objects` under `shop-documents` for the former `shop_id` prefixes (the app route does
  this automatically on the self-service path).
- The user's browser state is cleared by the client on the self-service path; in this manual flow,
  tell the user to sign out or clear cookies.

## Alternatives to permanent deletion

- **Soft closure:** leave the account, disable sign-ins (`UPDATE auth.users SET is_banned = true`
  on the admin API, or `admin.deleteUser`-equivalent `admin` ban flag). Retains everything,
  satisfies "we closed this account" without touching the audit log.
- If a retention exception is ever needed as a product feature, it must arrive as a **new,
  reviewed migration** — never by editing the frozen files.
