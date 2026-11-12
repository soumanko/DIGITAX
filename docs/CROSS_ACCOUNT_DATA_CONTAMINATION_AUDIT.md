# Cross-Account Data Contamination Audit

**Project:** DIGITAX  
**Date:** Tue Nov 10 2026  
**Status:** Resolved — all module pages and APIs resolved to server-side authorized business context  
**Classification:** Critical — data isolation / multi-tenant security

---

## 1. Executive Summary

A cross-account data contamination regression caused module pages (Transactions, GST, Banking, Reports, Contacts, Cash flow, P&L, Settings, Team activity, Reconciliation) to render hardcoded fixture data ("Aster Labs Pvt. Ltd.", "Ananya Kapoor", "AK") instead of the authenticated user's real business after login.

Root causes identified:
1. **13 static fixture pages** — every module page was a self-contained client component with hardcoded mock data, never calling any business-scoped API.
2. **Stale `dx_active_shop` cookie** — `getAuthenticatedContext()` trusted a possibly-stale/invisible cookie value without falling back to the authenticated user's own authorized shops.
3. **Phantom `shops.is_active` column** — `/api/shops/list` and `/api/shops/switch` referenced a non-existent `is_active` column, breaking business listing/switching.

No production data was mutated, no users or businesses were deleted, and no RLS policies were changed. All repairs are server-side data-integration fixes that preserve the approved frontend design exactly.

---

## 2. Root Cause Analysis

### Root Cause 1 — Static fixture pages (primary)

Every module page was a `'use client'` component containing hardcoded mock data:
- Sidebar business chip hardcoded to `"AK"` / `"Ananya Kapoor"` / `"Aster Labs Pvt. Ltd."`.
- Table rows, KPI cards, charts, and contact lists seeded with fixture values unrelated to any real business.
- No calls to `/api/transactions`, `/api/invoices`, `/api/gst/summary`, `/api/audit-events`, or `/api/shops`.
- No server-side authorization; no `shop_id` scoping.

**Affected files (13 pages):**
- `src/app/transactions/page.tsx`
- `src/app/reconciliation/page.tsx`
- `src/app/gst/page.tsx`
- `src/app/banking/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/contacts/page.tsx`
- `src/app/contacts/vendor-profile/page.tsx`
- `src/app/cash-flow/page.tsx`
- `src/app/profit-&-loss/page.tsx`
- `src/app/gst-return-filing/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/team-activity/page.tsx`

### Root Cause 2 — Stale `dx_active_shop` cookie

`getAuthenticatedContext()` in `src/lib/supabase/server-db.ts` read `dx_active_shop` from cookies and, when present but stale/invisible (e.g. a shop the user no longer owns, or a cookie left from a previous session), used it directly. There was no fallback to the user's own newest authorized shop, so a stale cookie could resolve to the wrong business or to `null` (triggering a spurious onboarding state).

**Fix:** When the cookie shop is not found or not authorized, fall back to the user's own newest authorized shop (`shops` ordered by `created_at DESC`, limit 1). RLS guarantees this never returns foreign data.

**File:** `src/lib/supabase/server-db.ts` — `getAuthenticatedContext()`

### Root Cause 3 — Phantom `shops.is_active` column

`/api/shops/list` and `/api/shops/switch` filtered/updated on `shops.is_active`, a column that does not exist in the schema (confirmed by DB topology probe). This caused business listing and switching to fail, leaving users stuck with no resolvable business context.

**Fix:** Removed all `is_active` references from `/api/shops/list` and `/api/shops/switch`.

**Files:**
- `src/app/api/shops/list/route.ts`
- `src/app/api/shops/switch/route.ts`

---

## 3. Contamination Vectors Eliminated

| Vector | Before | After |
|--------|--------|-------|
| Sidebar business chip | Hardcoded `"AK"` / `"Ananya Kapoor"` | `StaticBusinessName` component reading the RLS-resolved shop |
| Header user chip | Hardcoded `"AK"` + `"Ananya Kapoor"` / `"Admin"` | `identityInitials(userEmail)` + real email from `supabase.auth.getUser()` |
| Page data | Hardcoded fixture rows | Real fetch from RLS-scoped APIs (`cache: 'no-store'`) |
| Filters | Hardcoded select options ("Ananya", "Arjun", …) | Derived from the business's own data |
| Pagination | Static / absent | Functional, derived from real record counts |
| Empty state | "Sample data" label | Real loading / empty / error / needs-onboarding states |
| Footer label | "Sample data" | "Live data · … this business's own records" |

---

## 4. Verification Performed

- `npx tsc --noEmit` — exit 0
- `npm run lint` — 0 errors (125 pre-existing warnings)
- `npm test` — 44/44 pass (later extended to 50/50 with the cross-tenant suite)
- `npm run build` — exit 0, all pages build
- Cross-tenant RLS test — `src/lib/__tests__/cross_tenant_isolation.test.ts` (User A / User B, ephemeral service-created identities, teardown cleanup)

No fixture strings remain in any module page. Unauthenticated redirect to `/login` remains intact.

---

## 5. Files Repaired

**Page data-source repairs (13):**
`src/app/transactions/page.tsx`, `src/app/reconciliation/page.tsx`, `src/app/gst/page.tsx`, `src/app/banking/page.tsx`, `src/app/reports/page.tsx`, `src/app/contacts/page.tsx`, `src/app/contacts/vendor-profile/page.tsx`, `src/app/cash-flow/page.tsx`, `src/app/profit-&-loss/page.tsx`, `src/app/gst-return-filing/page.tsx`, `src/app/settings/page.tsx`, `src/app/team-activity/page.tsx`.

**Shared context / infrastructure:**
- `src/lib/client/use-shop-context.ts` — added `userId`, authoritative `shop`/`userEmail`/`refresh()`; no demo fallbacks.
- `src/components/layout/static-business-name.tsx` — new component replacing every hardcoded sidebar chip.
- `src/lib/supabase/server-db.ts` — `getAuthenticatedContext()` cookie fallback; `logAuditEventServer()` append-only metadata.
- `src/app/api/audit-events/route.ts` — new RLS-scoped audit-events feed.
- `src/app/api/shops/list/route.ts` — removed phantom `is_active`.
- `src/app/api/shops/switch/route.ts` — removed phantom `is_active`.

**Test:**
- `src/lib/__tests__/cross_tenant_isolation.test.ts` — new User A / User B cross-tenant isolation suite.

No database migrations, RLS policies, users, or businesses were created, modified, or deleted.

---

## 6. Residual Items (documented, owner action required)

- Two production shops exist (`ARAV LOSS RETAIL`, `ARAV HIGH LOSSMAKING RETAIL`), both owned by `soumankotest@gmail.com`, both with zero invoices/transactions/documents. They cannot be deleted (no user/business deletion authorized). Documented here; deletion remains an owner-authorized runbook step.
- Leftover demo user `ramesh@freshmart.in` exists but cannot be deleted. Documented here.
- `src/lib/demo-businesses/` is imported nowhere in the app; seed scripts use string shop IDs against UUID columns and never landed. Left in place per "do not delete existing files" rule.
