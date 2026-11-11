# API Authorization Audit

**Project:** DIGITAX  
**Date:** Tue Nov 10 2026  
**Status:** Complete  
**Classification:** Security / API

---

## 1. Purpose

Audit every API route and server function for business-context authorization. Every business-specific operation must authenticate the request, resolve the current user's authorized membership, validate ownership, and return only authorized records. Browser-supplied `shop_id` is never trusted as proof of authorization.

---

## 2. Authorization Pattern (all routes)

```ts
const ctx = await getAuthenticatedContext();
if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
if (!ctx.shop) return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
// All queries scoped to ctx.shop.id; RLS enforces at the database layer
```

`getAuthenticatedContext()` (`src/lib/supabase/server-db.ts`):
1. `supabase.auth.getUser()` → unauthenticated → `{ userId: '', shop: null }` (fail closed).
2. Reads `dx_active_shop` cookie; if stale/invisible/unauthorized, falls back to the user's own newest authorized shop.
3. Validates shop membership (owner or `shop_members`).
4. Returns the authorized shop or `null`.

---

## 3. Route-by-Route Audit

| Route | Method | Auth | Business scope | Notes |
|-------|--------|------|----------------|-------|
| `/api/shops` | GET | `getAuthenticatedContext()` | Returns `ctx.shop` or `{ shop: null, needsOnboarding: true }` | Active business resolution |
| `/api/shops/list` | GET | `getAuthenticatedContext()` | Lists user's authorized shops | Phantom `is_active` column removed |
| `/api/shops/switch` | POST | `getAuthenticatedContext()` | Switches to an authorized shop only | Sets `dx_active_shop` httpOnly cookie; no `is_active` |
| `/api/transactions` | GET | `getAuthenticatedContext()` | RLS-scoped to `ctx.shop.id` | `cache: 'no-store'` from clients |
| `/api/invoices` | GET | `getAuthenticatedContext()` | RLS-scoped to `ctx.shop.id` | Invoice + line items |
| `/api/invoices/[id]` | GET | `getAuthenticatedContext()` | RLS-scoped; cross-shop ID rejected | Single invoice |
| `/api/reconciliation` | GET | `getAuthenticatedContext()` | Same-shop match suggestions | `enforce_reconciliation_same_shop` trigger |
| `/api/reconciliation/history` | GET | `getAuthenticatedContext()` | RLS-scoped to `ctx.shop.id` | Match history |
| `/api/gst/summary` | GET | `getAuthenticatedContext()` | Engine figures for shop/period | `calculationVersion`, `rulesetVersion` |
| `/api/audit-events` | GET | `getAuthenticatedContext()` | RLS-scoped to `ctx.shop.id` | `limit`/`offset`, relaxed rate limiter |
| `/api/exports` | GET | `getAuthenticatedContext()` | GSTR-1 JSON / GSTR-3B CSV per shop/period | CSV sanitized (formula injection) |
| `/api/documents` | GET/POST | `getAuthenticatedContext()` | `shop-documents` bucket, `{shop_id}/…` | MIME + size validation |
| `/api/documents/[id]` | GET | `getAuthenticatedContext()` | Signed URL, RLS-controlled | Authorized access only |
| `/api/documents/[id]/signed-url` | GET | `getAuthenticatedContext()` | RLS-controlled | Time-limited signed URL |
| `/api/auth/signout` | POST | Session cookie | Clears session | Redirect to `/login` |
| `/api/auth/mfa/challenge` | POST | Session | MFA challenge | — |
| `/api/auth/mfa/verify` | POST | Session | MFA verify | — |

**Server-action / elevated operations:**
- `createServiceClient()` (service role key) is server-side only, never exposed to the browser. Used for elevated operations (e.g. ephemeral test-user creation in `cross_tenant_isolation.test.ts`, which tears down its own identities).
- `logAuditEventServer()` appends immutable audit events (`actor_id` = UUID only; metadata is arbitrary key/value, e.g. `{ name, gstin }`). `audit_events` is append-only (DB triggers reject UPDATE/DELETE).

**Audit logging (material financial actions):**
- Shop creation, invoice creation, transaction import, reconciliation confirmation, GST summary generation each log an `audit_events` entry on success only.

---

## 4. Authorization Failures

| Condition | Response | Information leaked |
|-----------|----------|-------------------|
| No session | `401 Unauthorized` | None |
| No active business | `404 No active business shop found` | None |
| Cross-shop `shop_id` in request | Ignored; server-resolved shop used | None |
| Cross-shop record access by ID | RLS returns empty / error | None (generic "Internal server error" message) |
| Cross-shop write | RLS `WITH CHECK` rejects | None |
| Rate limit exceeded | Relaxed limiter response | None |

Error messages returned to the client are safe (no stack traces, no internal IDs). Failures are logged server-side.

---

## 5. Client-Side Data Fetching

All module pages fetch business APIs with `cache: 'no-store'` and re-fetch on context change (`shop?.id`) or `refresh()`. No client-side caching of private API responses. No `shop_id` is ever sent from the client as authorization.

---

## 6. Row Level Security (RLS)

- Enabled on all tenant tables (`shops`, `documents`, `invoices`, `invoice_items`, `transactions`, `reconciliation_matches`, `filing_periods`, `gst_summaries`, `review_issues`, `audit_events`).
- Policies use `auth.uid()`, `is_shop_member(shop_id)`, `is_shop_admin(shop_id)`, `owner_id = auth.uid()`.
- No RLS policies were added, removed, or modified during this repair.
- Cross-shop reconciliation matches are rejected by the `enforce_reconciliation_same_shop` database trigger.

---

## 7. Verification

- `npx tsc --noEmit` — exit 0
- `npm run lint` — 0 errors
- `npm test` — 50/50 pass (includes unauthenticated rejection and cross-shop rejection tests)
- `npm run build` — exit 0
- Cross-tenant RLS test (`cross_tenant_isolation.test.ts`): User A cannot read User B's invoices by ID; User A cannot write to Shop B; unauthenticated reads return empty arrays.
