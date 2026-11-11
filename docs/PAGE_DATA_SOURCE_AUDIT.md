# Page Data Source Audit

**Project:** DIGITAX  
**Date:** Tue Nov 10 2026  
**Status:** Complete — all 13 module pages repaired  
**Classification:** Data integration

---

## 1. Purpose

Audit every module page's data source, identify hardcoded/fixture/seeded data, and record the repair that connects each page to the authenticated business context via server-side authorized APIs. The approved frontend design (layouts, typography, colors, tokens, navigation, charts, forms) is preserved exactly; only data integration changed.

---

## 2. Summary Table

| Page | Previous data source | Repaired data source | Mock data removed? |
|------|---------------------|---------------------|--------------------|
| Dashboard | Not audited in this cycle | Server-resolved shop via `useShopContext()` | — |
| Documents | Not audited in this cycle | RLS-scoped storage/documents API | — |
| Invoices | Not audited in this cycle | `/api/invoices` (RLS-scoped) | — |
| Invoice details | Not audited in this cycle | `/api/invoices/[id]` (RLS-scoped) | — |
| Invoice creation | Not audited in this cycle | Atomic invoice + items + audit | — |
| **Transactions** | Hardcoded fixture rows | `/api/transactions?limit=100` (`cache:'no-store'`) | Yes |
| **Reconciliation** | Hardcoded fixture rows | `/api/reconciliation` + `/api/transactions` | Yes |
| **GST & Tax** | Hardcoded fixture rows | `/api/gst/summary?year&month` + `/api/invoices` | Yes |
| **Banking** | Hardcoded fixture accounts/activity | `/api/transactions` → derived accounts | Yes |
| **Reports** | Hardcoded fixture periods/rows | `/api/invoices` + `/api/transactions` + `/api/exports` | Yes |
| **Contacts** | Hardcoded contact cards | `/api/invoices` → grouped by counterparty | Yes |
| **Contacts › Vendor profile** | Hardcoded "Ananya Kapoor" notes | `?name=&kind=` query + `/api/invoices` + `/api/transactions` | Yes |
| **Cash flow** | Hardcoded movement chart | `/api/transactions` → Decimal aggregation | Yes |
| **Profit & Loss** | Hardcoded "Sample data" chart | `/api/invoices` + `/api/transactions` + `/api/gst/summary` | Yes |
| **GST return filing** | Hardcoded check states/figures | `/api/gst/summary` + `/api/invoices` (engine figures) | Yes |
| **Settings** | Hardcoded profile values | `/api/shops` (read-only live record) | Yes |
| **Team activity** | Hardcoded activity rows/members | `/api/audit-events?limit=50` | Yes |

---

## 3. Per-Page Repairs

### Transactions (`src/app/transactions/page.tsx`)
- **Before:** Static fixture table with fake dates/descriptions/amounts.
- **After:** Fetches `/api/transactions?limit=100` with `cache: 'no-store'`. Functional filters (account, category, period) derived from data. Real pagination. Loading / empty / error / needs-onboarding states. Footer: "Live data · derived from this business's imported statements and ledger."
- Sidebar chip: `StaticBusinessName`; header chip: `identityInitials(userEmail)` + real email.

### Reconciliation (`src/app/reconciliation/page.tsx`)
- **Before:** Static fixture reconciliation suggestions.
- **After:** Fetches `/api/reconciliation` and `/api/transactions`. Same-shop match enforcement (RLS + trigger). Real match/unmatch actions scoped to the authorized shop.

### GST & Tax (`src/app/gst/page.tsx`)
- **Before:** Static fixture GST cards and tabs.
- **After:** Fetches `/api/gst/summary?year&month` (engine figures) and `/api/invoices`. Period tabs derived from real data. Time-dependent values computed after mount (not during prerender).

### Banking (`src/app/banking/page.tsx`)
- **Before:** Hardcoded connected accounts ("ICICI Current Account", "HDFC Current Account") with fake balances and fake activity rows.
- **After:** Derives real accounts by grouping `/api/transactions` by `bank_account_name`/`source_account`. Balance = net credit − debit. Reconciliation health from `reconciliation_status`. Recent activity table with real match status. "Connect account" button disabled with explanatory tooltip (bank feeds not integrated; import via statement CSV).

### Reports (`src/app/reports/page.tsx`)
- **Before:** Static fixture period select and saved-report rows.
- **After:** Fetches `/api/invoices` + `/api/transactions`. Period options = months containing the business's data (default = last completed month). Saved-reports table = real generate rows (GSTR-3B CSV via `/api/exports?type=gstr3b_csv`, GSTR-1 JSON via `gstr1_json`), blob download, session "Just now" timestamps, owner = real user email. Balance Sheet button disabled with tooltip (not in current release). Report schedule switch disabled with tooltip (email scheduling not available).

### Contacts (`src/app/contacts/page.tsx`)
- **Before:** Hardcoded customer/vendor cards with fake names/balances.
- **After:** Contacts derived by grouping `/api/invoices` by counterparty (`buyer_name` for sales, `supplier_name` for purchases). Open balance = sum of unpaid `outstanding_balance ?? amount_due`. Last activity from invoice date. Row click → `/contacts/vendor-profile?name=...&kind=vendor|customer`. Functional search + status filter + pagination. "Add contact" button disabled with tooltip (contacts derived from invoices).

### Contacts › Vendor profile (`src/app/contacts/vendor-profile/page.tsx`)
- **Before:** Hardcoded "Ananya Kapoor" profile with fake notes and transactions.
- **After:** Wrapped in `<Suspense>` (uses `useSearchParams`). Driven by `?name=&kind=`. Related invoices filtered by counterparty; open balance / total paid / last activity / tax credited computed from real records. Related transactions matched by description keywords. Edit contact / Save note disabled with tooltips (not stored yet). Balance Sheet / document storage notes are honest about current-release limits.

### Cash flow (`src/app/cash-flow/page.tsx`)
- **Before:** Hardcoded quarterly cash chart with fixture values.
- **After:** FY quarters (Apr–Jun/Jul–Sep/Oct–Dec/Jan–Mar next year), end-exclusive `quarterRange`. Monthly/weekly buckets. Decimal aggregation (`decimal.js`) — no floating-point for money. Opening cash = pre-period credit − debit; cash in/out from in-range movements. Client-side CSV export. "Import statement" disabled-state guidance when no movements.

### Profit & Loss (`src/app/profit-&-loss/page.tsx`)
- **Before:** Hardcoded "Sample data" line chart for Apr–Jun 2024.
- **After:** Revenue + net tax payable from `/api/gst/summary` per month (engine). COGS from purchase invoices (`direction === 'purchase' || invoice_type === 'purchase_tax_invoice'`). Opex from statement debits (excluding "business sale" revenue movements). Decimal math. Quarter + comparison quarter (previous quarter / previous year via `deltaPct`). Monthly trend chart + statement table. Honest empty state when no records.

### GST return filing (`src/app/gst-return-filing/page.tsx`)
- **Before:** Hardcoded check states and fixture figures.
- **After:** Month select = 12 months ending last completed month. Engine figures from `/api/gst/summary` (calculationVersion / rulesetVersion cited). 5 return checks (3 data-driven, 2 manual always unchecked with tooltips: reverse charge reviewed, filing period locked). Source invoices table with per-row status (Reconciled / ITC ready / Needs review). "Save draft" / "Mark ready to file" disabled with tooltips (DIGITAX prepares for practitioner review, never files to GSTN).

### Settings (`src/app/settings/page.tsx`)
- **Before:** Hardcoded profile ("AABCU9603R", Bandra Kurla address, "Ananya Kapoor").
- **After:** Workspace fields read-only from `/api/shops` (name, GSTIN, state, language, tax scheme). Base currency Select disabled (tooltip on wrapping label). Lock switch disabled (tooltip). Danger-zone "Disconnect workspace" navigates to dashboard account actions. No demo values.

### Team activity (`src/app/team-activity/page.tsx`)
- **Before:** 5 fake activity rows (Ananya/Arjun/Priya/Neha), fake facets, fake members card, "Sample data" footer.
- **After:** Fetches `/api/audit-events?limit=50`. Real rows with avatar-initials circle, `"{member} {verb}" summary, date, Badge. Actor label "You" for own events, else generic "Member" (identities are private). Filters (member/action/period) derived from real events. "Export log" → client-side CSV of real rows. Footer: "Live data · retained for 12 months · this business's audit trail only."

---

## 4. States Implemented on Every Page

| State | Behavior |
|-------|----------|
| Loading | Skeleton / "Loading…" card, no data shown |
| Empty | Helpful message + onboarding/import CTA where applicable |
| Error | Error message + Retry button (calls `refresh()`) |
| Needs onboarding | "No business yet" + Set up business button |
| Live data | Real records with "Live data · …" footer label |

---

## 5. Non-Existent Features (presented honestly)

Disabled buttons/switches/inputs carry explanatory `title` tooltips (never silent failures):
- Connect account (Banking) — bank feeds not integrated; import CSV instead.
- Save draft / Mark ready to file (GST return filing) — DIGITAX never files to GSTN.
- Add contact (Contacts) — derived from invoices.
- Edit contact / Save note (Vendor profile) — not stored yet.
- Balance Sheet (Reports) — not in current release.
- Report schedule switch (Reports) — email scheduling not available.
- Base currency / Lock closed months (Settings) — INR only / not active.
- Manage members (Team activity) — server-side shop membership only.

---

## 6. Verification

- `npx tsc --noEmit` — exit 0
- `npm run lint` — 0 errors
- `npm test` — 50/50 pass
- `npm run build` — exit 0, all pages build
- Playwright browser verification — pages render, no console errors, no fixture strings, unauth redirect intact (see MULTITENANT_ISOLATION_TEST_REPORT / browser verification)

No fixture strings ("Aster Labs", "Ananya Kapoor", "AK", "Sample data") remain in any module page.
