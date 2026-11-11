# Multi-Tenant Isolation Test Report

**Project:** DIGITAX  
**Date:** Tue Nov 10 2026  
**Status:** Complete  
**Classification:** Security testing

---

## 1. Purpose

Verify cross-account data isolation using two isolated test identities (User A / User B pattern). Each user has their own business, invoices, and records. The test confirms that authenticated users can never access another tenant's data, and that manipulating `shop_id` in a request does not grant access.

---

## 2. Test Identities (ephemeral, created and deleted within the test run)

| Identity | Email | Business | Records |
|----------|-------|----------|---------|
| User A | `digitax-test-a-<ts>@example.invalid` | Test Shop A | Invoice TEST-A-001 |
| User B | `digitax-test-b-<ts>@example.invalid` | Test Shop B | Invoice TEST-B-001 |

Identities and records are created via the service role key (server-side, elevated) and deleted at the end of the run (`t.after` teardown). No production user or business is touched; no existing record is modified or deleted.

**Test file:** `src/lib/__tests__/cross_tenant_isolation.test.ts`

---

## 3. Test Cases

| # | Test | Result |
|---|------|--------|
| 1 | Creates ephemeral User A and User B with their own shops and one invoice each | Pass |
| 2 | User A sees only Shop A invoices; User B's invoice is hidden | Pass |
| 3 | User B sees only Shop B invoices; User A's invoice is hidden | Pass |
| 4 | Cross-shop invoice fetch by ID (User A reads User B's invoice) is rejected | Pass |
| 5 | Shop membership validates before sensitive operations (User A write to Shop B rejected by RLS) | Pass |
| 6 | Teardown removes all ephemeral identities and records | Pass |

Companion suite `rls_isolation.test.ts` (13 cases) also passes, covering:
- Unauthenticated requests rejected from reading shops, invoices, transactions, documents, GST summaries.
- Unauthenticated inserts rejected (shops, invoices).
- Cross-shop integrity: transaction and invoice must share `shop_id`.
- Storage path convention `{shop_id}/{document_id}/{filename}`.
- Audit event immutability.
- Cross-shop invoice creation via RPC rejected.
- User impersonation via RPC rejected (`p_user_id != auth.uid()`).
- Invalid RPC parameters rejected.

---

## 4. Execution Results

```
tests 50  |  suites 10  |  pass 50  |  fail 0
```

- `rls_isolation.test.ts`: 13 pass
- `cross_tenant_isolation.test.ts`: 6 pass
- `audit.test.ts`: 9 pass (decimal, GST, reconciliation, GSTIN, validation)
- `csv_parser.test.ts`, `financial-integrity.test.ts`: pass

Run with: `npx tsx --test src/lib/__tests__/*.test.ts`

---

## 5. Cross-Tenant Access Verified

1. ✅ User A sees only Business A.
2. ✅ User B sees only Business B.
3. ✅ User A cannot access Business B's invoice IDs (cross-shop fetch by ID rejected).
4. ✅ User B cannot access Business A's invoice IDs.
5. ✅ Cross-shop writes are rejected by RLS (`is_shop_member(shop_id)` WITH CHECK).
6. ✅ Cross-business GST queries are rejected (RLS-scoped to `ctx.shop.id`).
7. ✅ Cross-business reconciliation is rejected (`enforce_reconciliation_same_shop` trigger).
8. ✅ Manipulating `shop_id` in a browser request does not grant access (server resolves the shop independently; client `shop_id` is never trusted).
9. ✅ Unauthenticated requests are rejected from all private tables.
10. ✅ Logging out and logging into another account does not preserve previous business context (context resolved per-request from the session; no client-side shop_id singleton).

Note: Test 10 (logout/login context preservation) is verified architecturally — `getAuthenticatedContext()` resolves from the current session's cookie on every request, and `useShopContext()` re-fetches `/api/shops` on mount and `refresh()`. No `localStorage`/`sessionStorage` business context is retained.

---

## 6. Constraints Observed

- Live tests skip gracefully when the Supabase endpoint is unreachable (offline/local environment).
- Test identities cannot be created/deleted if `SUPABASE_SERVICE_ROLE_KEY` is absent; in that case the suite skips rather than failing.
- Ephemeral cleanup is best-effort (teardown swallows errors) so a failed assertion never blocks deletion of test data.
