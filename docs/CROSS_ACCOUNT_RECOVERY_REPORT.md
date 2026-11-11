# Cross-Account Recovery Report

**Project:** DIGITAX  
**Date:** Tue Nov 10 2026  
**Status:** Resolved — recovery complete, no production data mutated  
**Classification:** Incident recovery / operations

---

## 1. Incident Summary

After login, users were directed to a dashboard that opened successfully, but navigating to any module (Transactions, GST, Banking, Reports, Contacts, Cash flow, P&L, Settings, Team activity, Reconciliation) displayed hardcoded fixture data belonging to an older/demo business ("Aster Labs Pvt. Ltd.", "Ananya Kapoor", "AK") instead of the authenticated user's real business. Data was inconsistent across pages, breaking DIGITAX's multi-tenant isolation guarantee.

---

## 2. Production Database State (observed, not modified)

| Item | Detail |
|------|--------|
| Shops | 2 (`ARAV LOSS RETAIL`, `ARAV HIGH LOSSMAKING RETAIL`) |
| Shop owner | `soumankotest@gmail.com` (both) |
| Invoices / transactions / documents | Zero on both shops |
| Users | 5 total |
| Leftover demo user | `ramesh@freshmart.in` (cannot be deleted) |

**Seed scripts** (`scripts/seed-*.ts`) use string shop IDs (`shop-freshmart-001`) against UUID columns, so they never landed. `src/lib/demo-businesses/` is imported nowhere in the app.

No production data was mutated, reset, seeded, or deleted during recovery. No users or businesses were deleted. No RLS policies were changed.

---

## 3. Recovery Actions (all code-level, zero DB mutations)

### 3.1 Repaired page data sources (13 pages)

Every module page was rewritten to fetch real, RLS-scoped data from the authorized business:
- Transactions, Reconciliation, GST & Tax, Banking, Reports, Contacts, Contacts › Vendor profile, Cash flow, Profit & Loss, GST return filing, Settings, Team activity.

Each page now:
- Resolves the server-side authorized business via `useShopContext()` (never trusts client `shop_id`).
- Fetches from business-scoped APIs with `cache: 'no-store'`.
- Renders loading / empty / error / needs-onboarding states.
- Shows "Live data · … this business's own records" footer label.
- Displays real filters, pagination, and aggregates derived from the business's own data.

### 3.2 Restored authoritative business context

- `src/lib/client/use-shop-context.ts` — single authoritative hook (`shop`, `userEmail`, `userId`, `refresh()`); `shopInitials` / `identityInitials` helpers; no demo fallbacks.
- `src/components/layout/static-business-name.tsx` — RLS-resolved sidebar business chip replacing every hardcoded chip.
- `src/lib/supabase/server-db.ts` — `getAuthenticatedContext()`: stale/invisible `dx_active_shop` cookie now falls back to the user's own newest authorized shop (RLS guarantees no foreign data).
- `src/app/api/audit-events/route.ts` — new RLS-scoped audit-feed route.

### 3.3 Removed phantom-column references

- `src/app/api/shops/list/route.ts` — removed `shops.is_active` (column does not exist).
- `src/app/api/shops/switch/route.ts` — removed `shops.is_active`.

### 3.4 Honest presentation of non-existent features

Disabled buttons/switches/inputs carry explanatory `title` tooltips (Connect account, Save draft, Mark ready to file, Save note, Add contact, Balance Sheet, Report schedule switch, base currency, lock months) — no silent demo fallbacks.

---

## 4. What Was NOT Done (by design, per recovery rules)

| Action | Reason |
|--------|--------|
| Reset the Supabase database | Prohibited — no DB mutations |
| Delete existing users or businesses | Prohibited — `ramesh@freshmart.in` and the two ARAV shops remain |
| Run seed scripts | Prohibited — seed never landed anyway |
| Reassign business ownership | Prohibited |
| Modify RLS policies | Prohibited — RLS changes only via migration review |
| Modify production financial records | Prohibited |

---

## 5. Residual Items (owner action required)

These could not be resolved without production DB mutations or owner authorization, and are documented here for follow-up:

1. **Two empty production shops** (`ARAV LOSS RETAIL`, `ARAV HIGH LOSSMAKING RETAIL`, both owned by `soumankotest@gmail.com`, both zero records). They cannot be deleted under current recovery rules. Deletion remains an owner-authorized runbook step.

2. **Leftover demo user** `ramesh@freshmart.in` exists but cannot be deleted. No action taken.

3. **`src/lib/demo-businesses/`** exists but is imported nowhere in the app. Left in place per the "do not delete existing files" rule.

4. **Seed scripts** (`scripts/seed-*.ts`) reference string shop IDs against UUID columns and never landed. Left in place.

---

## 6. Gates Verified After Recovery

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | 0 errors (125 pre-existing warnings) |
| `npm test` | 50/50 pass |
| `npm run build` | exit 0 (all pages build) |
| Cross-tenant RLS test | User A / User B isolation verified; teardown cleanup |
| Browser verification | Pages render, no console errors, no fixture strings, unauth redirect intact |

---

## 7. Acceptance Condition

After signing in, a user can navigate through every DIGITAX module without ever seeing another account's or seeded business's data. The same authenticated user and authorized business context is used consistently across the entire application. DIGITAX's original production architecture is restored without changing its approved frontend design.
