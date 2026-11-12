# DIGITAX Full-Codebase Engineering Audit

**Date:** 2026-11-09  
**Repository:** D:\DIGITAX  
**Git HEAD:** `d9af8ce` (v2.0) — all changes uncommitted on `main` at time of audit  
**Scope:** Every page and API route in the application — data sources, authorization, dead controls, demo contamination, and remediation state

---

## 1. Executive Summary

The codebase was inventoried end-to-end: **31 pages**, **20 API route files (32 exported handlers)**, the shared library layer, and the test suite. Two engineering passes (Phase 1: security core and data-flow reconnection; Phase 2: remaining dead interactions and honest-state conversion) remediated the findings below.

**Outcome:** the write path is restored (the previous CSRF scheme made *every* mutation return 403), all pages either operate on real authorized data or are explicitly labelled as samples, and no fabricated figures remain in financial surfaces.

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm test` | **44/44 across 8 suites** |
| `npm run lint` | **0 errors / 126 warnings** |
| `npm run build` | PASS (Next.js 16.4.1) |
| Browser verification | 10 screenshots + live DOM evidence (`docs/screenshots/`) |

---

## 2. Page Inventory (31 pages) — Final State

Verification codes: **[B]** browser-verified this pass · **[CR]** code-review-verified (typecheck/lint/build pass) · **[A]** classified by audit, deliberately retained

| Route | Class | Current State |
|-------|-------|---------------|
| `/` | Marketing | Real CTAs → `/register`, `/how-it-works` [B] |
| `/login` | Auth | Real `signInWithPassword`; invalid-credentials banner; demo button disabled+tooltip [B] |
| `/sign-in` | Auth | Real `signInWithPassword`; Google button disabled w/ tooltip; legal links → `/security` [CR] |
| `/register` | Auth | Real `signUp` + account metadata (business name, validated GSTIN); forwards to `/onboarding` on session [CR] |
| `/reset-password` | Auth | Email step (real `resetPasswordForEmail`) + functional step-2 (`updateUser`) with success/expired-link states [CR] |
| `/onboarding` | App | Real shop creation; mock defaults cleared; required selects [CR] |
| `/dashboard` | App | Real-derived KPIs (MoM deltas, statutory GSTR-3B due = 20th of next month, real 6-month series, real filing completion); clickable tasks; real sidebar links [CR] |
| `/invoices` | App | Real list/grid from `/api/invoices`; View → `/invoice-details?id=`; Delete → `DELETE /api/invoices/{id}`; load/error banner [CR] |
| `/invoice-details` | App | Honors `?id=` with real fetch (items, CGST/SGST/IGST, payment status); **Sample**-labelled fallback mode otherwise [CR] |
| `/review` | App | Real invoices; PATCH review-state persistence; honest audit log from real confirmations [CR] |
| `/documents` | App | Real upload (MIME/size validated client+server) and delete [CR] |
| `/transactions` | App | Real API-backed list; CSV import flow to `/api/transactions` (Zod-validated) [CR] |
| `/expense-capture` | App | Real save (`POST /api/transactions`) + receipt upload (`POST /api/documents`) [CR] |
| `/exports` | App | Working GSTR-3B CSV / GSTR-1 JSON downloads via fetch+blob; remaining cards honest "In Development" [CR] |
| `/assistant` | App | GNANI chat; real shop context incl. real unreconciled count + period; error banner + retry; fails safe when `GNANI_EVON_API_KEY` unset [CR] |
| `/gst` | App | Real GST data via summary engine [A] |
| `/reconciliation` + sample | App | Real queue via `/api/reconciliation`; **sample card UI retained with disabled actions** ("this is a sample layout" tooltip) [A] |
| `/gst-return-filing` | Sample-labeled | Read-only sample; Save draft / Mark ready to file / Resolve issues honestly disabled; "never files to GSTN" states [A] |
| `/banking` | Sample-labeled | Connect/Upload actions honestly disabled; navigation real [A] |
| `/settings` | App | Real profile/tenant surfaces; active-shop handling [A] |
| `/contacts`, `/contacts/vendor-profile` | App | API-backed contact data [A] |
| `/reports`, `/cash-flow`, `/profit-&-loss` | App | Real derived financial pages [A] |
| `/team-activity` | App | Real activity feed [A] |
| `/features`, `/how-it-works`, `/faq`, `/security` | Marketing | Static content pages [B] |
| `/404` | Utility | CTAs repaired → `/register`, `/faq` [B] |

Every visual control classified "sample" is disabled **with an explanatory native tooltip**; none present fabricated successful actions.

---

## 3. API Inventory (20 files / 32 handlers)

Authorization pattern (all shop-scoped routes): session via `getAuthenticatedContext()` → 401 when unauthenticated → 404 when no active shop → `ctx.shop.id` scoping → RLS backstop. Mutations: Origin/Host `csrfMiddleware` + rate limits. All errors return safe client messages (leak sweep completed).

| Route file | Methods | Notes |
|------------|---------|-------|
| `api/shops` | GET, POST | Active shop `{shop, isDemo:false}`; POST onboarding shop creation (CSRF+RL) |
| `api/shops/list` | GET | Own-shop list (dynamic; prerender-bailout handled) |
| `api/shops/switch` | POST | Membership-verified shop switch; sets `dx_active_shop` |
| `api/invoices` | GET, POST | List + create (Zod `invoiceSchema`; audit `invoice_created`) |
| `api/invoices/[id]` | GET, PATCH, PUT, DELETE | **Phase 2:** GET rate-limited; PATCH review-state machine + `invoice_review_state_changed` audit; PUT review-field updates; DELETE (confirm-flow consumer: invoices page) |
| `api/transactions` | GET, POST | **Phase 2:** POST Zod `importTransactionsSchema`/`bankTransactionInputSchema` (CSV import + expense-capture consumers); GET rate limit relaxed for list loads |
| `api/documents` | GET, POST, DELETE | Upload (MIME/size/content-hash, private `shop-documents` bucket `{shop_id}/{document_id}/{filename}`); delete enforces ownership |
| `api/documents/[id]` | PATCH | Document metadata/stage updates |
| `api/documents/[id]/signed-url` | GET | Owner-authorized signed URLs only |
| `api/gst/summary` | GET, POST | **Phase 2:** POST recomputes via `generateGSTPeriodSummary` server-side — client-computed values never persisted |
| `api/reconciliation` | GET, POST | Suggestions + confirm match (`confirmMatchSchema`; same-shop trigger enforced in DB, membership re-checked in route) |
| `api/reconciliation/history` | GET, DELETE | Match history; deletes re-verify membership |
| `api/exports` | GET | GSTR-3B CSV / GSTR-1 JSON for `ctx.shop` (server-generated; sanitized CSV fields) |
| `api/assistant` | POST | GNANI EVON — grounded responses only; unconfigured key → explicit unavailable message; never claims GSTN filing |
| `api/auth/signout` | POST | Session teardown; **Phase 2:** also clears `dx_active_shop` |
| `api/auth/mfa/enroll` | POST | Real Supabase MFA enrollment |
| `api/auth/mfa/challenge` | POST | **Phase 2:** corrected semantics — client-supplied `factorId` UUID |
| `api/auth/mfa/verify` | POST | **Phase 2:** requires `factorId` + `challengeId` + 6-digit code |
| `api/auth/mfa/status` | GET | Enrollment status |
| `api/auth/demo-session` | POST, DELETE | Dev-only cookie helper; **UI path disabled** on `/login` (unreachable from production interface) |

---

## 4. Library Layer

| Module | Role | Status |
|--------|------|--------|
| `src/lib/decimal.ts` | `money()`/`roundMoney()` (precision 20, ROUND_HALF_UP), `formatINR`, `calculateGSTComponents`, `validateInvoiceArithmetic`; **re-exports** `Decimal` | Source of truth for money (verified by 8-test suite) |
| `src/lib/gst/calculator.ts` | `calculateGSTComponents`, `generateGSTPeriodSummary` (GSTR-1/GSTR-3B/net payable), `validateGSTIN` | Deterministic; period-scoped; never negative per head |
| `src/lib/reconciliation/engine.ts` | `findMatchSuggestions` | Feeds `/api/reconciliation` suggestions (consumed by assistant + dashboard contexts) |
| `src/lib/security/csrf.ts` | Origin/Host verification middleware; deprecated token helpers | Rebuilt Phase 2 |
| `src/lib/validation/schemas.ts` | Zod: auth, invoice, transaction (`transactionCategorySchema` incl. `business_purchase`, `bank_transfer`, `loan_borrowing`, `owner_withdrawal`, `personal`, `cash_entry`), imports, review state | Single validation entrypoint |
| `src/lib/supabase/{client,server,server-db}.ts` | Anon-cookie client, SSR server client, `getAuthenticatedContext()` + scoped server DB functions | Untouched isolation core |
| `src/lib/rate-limiter.ts` / `distributed-rate-limiter.ts` | In-memory limiter (distribution module documented-dead until Redis/Upstash configured) | Operational with documented scope |
| `src/lib/ai/gnani.ts` | GNANI EVON assistant | No GSTN-filing claims; language-aware (en/hi/bn/mr) |
| `src/lib/demo-data.ts`, `src/lib/demo-businesses/*` | Legacy demo fixtures | **Isolated** — not imported by any production route/page |
| `scripts/*` (seed/bootstrap) | Data seeding utilities | Never executed in app runtime; **not run** during recovery (not authorized) |

---

## 5. Test Suite (8 suites / 44 tests, all passing)

| Suite | Coverage |
|-------|----------|
| Core logic (9) | Decimal + GST components + helpers |
| CSV parser (3) | Quoting, CRLF, DD/MM/YYYY + ISO dates, debit/credit + signed amounts |
| Multi-tenant RLS (13, live anon-key) | Unauthenticated reads rejected (shops/invoices/transactions/documents/GST summaries), anonymous inserts rejected, cross-shop match trigger, storage path convention, audit immutability, RPC abuse rejected |
| Financial integrity (19, new Phase 2) | ROUND_HALF_UP vs JS float, INR grouping, intra-state CGST=SGST / inter-state IGST, odd-paisa rounding, crore-scale precision, invoice arithmetic tolerance, GSTIN valid/sad cases, exact GSTR-1/GSTR-3B + determinism + non-negative clamp + empty period |

Tests live in `src/lib/__tests__/*.test.ts` (`npx tsx --test`).

---

## 6. Findings & Remediation Traceability (both phases)

| Finding | Severity | State |
|---------|----------|-------|
| Fake Google sign-in bypass | Critical | RESOLVED (Phase 1) |
| Demo cookie → mock user in middleware | Critical | RESOLVED (Phase 1) |
| Demo data in 7 API routes | Critical | RESOLVED (Phase 1) |
| Token-less CSRF → all mutations 403 (dead write path) | Critical | RESOLVED (Phase 2 — Origin/Host verification) |
| Static `invoice-details` mock ignoring `?id=` | High | RESOLVED (Phase 2) |
| `exports` permanent skeleton (cards unreachable) | High | RESOLVED (Phase 2) |
| `invoices` dead View/Delete; duplicate fetch | High | RESOLVED (Phase 2) |
| `expense-capture` save persists nothing | High | RESOLVED (Phase 2) |
| Fabricated dashboard KPIs (deltas/due date/chart/completion) | High | RESOLVED (Phase 2) |
| `review` fabricated audit rows | High | RESOLVED (Phase 2) |
| MFA routes invalid semantics + unbound refs | High | RESOLVED (Phase 2) |
| Error-message leakage in API routes | Medium | RESOLVED (Phase 2) |
| Protected-route list gaps (`/invoices`, `/invoice-details`, `/expense-capture`) | Medium | RESOLVED (Phase 2) |
| Sign-out leaves `dx_active_shop` | Medium | RESOLVED (Phase 2) |
| Onboarding mock defaults / fabricated register defaults | Medium | RESOLVED (Phase 2) |
| Broken links (landing/404/sign-in) | Low | RESOLVED (Phase 2) |
| Dead `useTheme` imports & `[resolvedTheme];` statements | Low | RESOLVED (both phases) |
| react-hooks lint errors (use-before-declare, sync setState in effect) | Medium | RESOLVED (Phase 2) |
| Demo fixture files in tree | Low | Isolated, documented |
| GNANI live key absent | Info | Fails safe (explicit unavailable message) |
| Redis/Upstash absent | Info | In-memory limiter documented |

---

## 7. Environment & Framework Notes

- **Next.js 16.4.1** (Turbopack): the AGENTS.md block from `node_modules/next/dist/docs` descriptions did not ship for this install — the `middleware.ts` → `proxy.ts` migration angle was documented in reports rather than blindly applied; the build emits `ƒ Proxy (Middleware)` and accepts the current convention.
- **New prerender rule respected:** no `new Date()` at prerender time in client components — pages compute "today"/periods inside client effects with null guards (`/dashboard`, `/exports`, `/expense-capture`).
- **`useSearchParams`** always Suspense-wrapped (`/invoice-details`).
- Dev server (port 3000, PID 118608) hot-reloads; production build verified via `npm run build`.

---

## 8. Out-of-Scopes & Honest Limitations

1. Live authenticated E2E (signup → onboarding → dashboard under RLS) requires creating test users in the **production** Supabase project — not authorized; covered by live anon-RLS probes + code review.
2. MFA banner/expiry states need an enrolled factor on a real account.
3. Deployment, DB destructive ops, seed scripts, RLS policy edits: all declined per authorization constraints; no fabrications in test or report data.

---

## 9. Audit Verdict

**Codebase state: RECOVERED for review.** Real auth + multi-tenant core intact and re-verified; write path restored; every page either real or honestly-labelled; gates green (44/44 tests, 0 lint errors, build PASS). Remaining work is deployment-time: apply reviewed migrations, provision Redis (optional), configure `GNANI_EVON_API_KEY` (optional), and run one authorized real-account walkthrough.

**Full-Codebase Audit Rating: PASS (with documented environment limitations)**

---

## 10. Phase 3 Addendum — Account Actions & OAuth Pass (2026-11-09)

Executive demand from the same recovery authorization: make "Continue with Google" functional, make all
account-creation CTAs reach `/register`, and add Log out + Delete account to the merchant dashboard.

### Inventory deltas

| Artifact | Change |
|---|---|
| `src/app/sign-in/page.tsx` | Google button rewired from disabled mock to real `signInWithOAuth` (PKCE, redirect via `/auth/confirm?next=%2Fdashboard`); honest failure banner; genuine Google "G" SVG replaces the `<span>` stand-in that caused the glyph-overlap defect |
| `src/app/api/auth/account/delete/route.ts` | **New** (+1 route file / +1 handler). CSRF → SSR auth → strict rate limit (`account-delete:{ip}:{userId}`) → typed `DELETE` confirmation → service-role `admin.deleteUser` (DB cascades all tenant data) → best-effort storage cleanup of pre-snapshot `documents.storage_path` values |
| `src/app/dashboard/page.tsx` | Account options panel (Log out / Delete account) mounted on both the sidebar user chip and the header avatar; panel shows the real signed-in email from `supabase.auth.getUser()`; deletion requires typing `DELETE` inline |
| `src/app/not-found.tsx` | **New** app-wide not-found convention file (unknown URLs previously rendered Next's default 404, orphaning the designed `/404` experience); reuses the 404 design with real CTAs |
| `src/app/404/page.tsx` | Bare-fragment header anchors (`#product` …) → `next/link` with `/#product` … so section links actually navigate; also resolves 8 `no-html-link-for-pages` lint errors |

### Verification this phase

- Live (Playwright): Google click redirected to the real Supabase authorize URL with PKCE
  (`code_challenge_method=s256`); CTA matrix all → `/register`; unknown URL renders the designed 404;
  hash-link click-through landed on `http://localhost:3000/#product`; 0 hydration errors.
- Gates after changes: `tsc` 0 · lint **0 errors** / 125 warnings · build PASS (`○ /_not-found`,
  `ƒ /api/auth/account/delete`) · unit tests unaffected (44/44 as of last run).
- Screenshots 11/12 added to `docs/screenshots/`.

### Honest limitations (phase 3)

Google's second hop requires provider credentials configured in the Supabase project dashboard
(outside this repo); the dashboard account menu and deletion flow were verified by code review, static
gates, and build only (no authorized prod account available), and the audit-trail immutability triggers
may legitimately refuse cascading deletion for accounts with audit history — the route fails closed with
a contact-support message rather than bypassing the audit log.

### Phase 3.1 — account-deletion silent-failure resolved (2026-11-09, same day)

A real deletion attempt on the audit-history account failed with a generic message. Live read-only
diagnostics (service-role, values never printed) pinpointed the truth: service key healthy; **2
audit events** (2 authored, 2 attached to the account's 2 shops), 0 import batches; combined
pre-check filter validated live in prod returning 2. The cascade delete is refused by
`trg_prevent_audit_update/delete` exactly as designed — both via `actor_id … CASCADE` (row DELETE)
and the shop re-point via `shop_id … SET NULL` (row UPDATE).

Remediation (within frozen-migration constraints):

- `POST /api/auth/account/delete` now pre-checks retained records and returns **409
  ACCOUNT_DELETION_BLOCKED_BY_RECORDS** with counts (no wasted destructive attempt); clean
  accounts proceed to real deletion.
- Import-batch blocker (frozen `imported_by` FK without delete action) added to the rule.
- `docs/SUPPORT_ACCOUNT_DELETION_RUNBOOK.md` — owner-authorized manual closure procedure.
- Dashboard panel: support link in the error box; expectation-setting copy in the confirm stage.

Gates after: `tsc` 0 · lint 0 errors/125 warnings · build PASS · unit tests 44/44.

**Phase 3.1 verdict: PASS — the observed failure is now explained to the user in the product itself.**
