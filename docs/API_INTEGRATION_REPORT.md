# DIGITAX API Integration Report

**Date:** 2026-11-09  
**Repository:** D:\DIGITAX  
**Scope:** Server–client integration integrity: contracts, authorization, validation, rate limiting, CSRF, and UI wiring for all 20 API route files (32 handlers)

---

## 1. Executive Summary

Every API route was re-aerated against its frontend consumer during the recovery. The blocking discovery of the pass was that **the previous CSRF middleware made every cookie-authenticated mutation return 403** (no token was ever issued anywhere in the app) — i.e., the entire write path, despite being correctly coded server-side, was unreachable from the UI. The write path is restored with Origin/Host verification.

All routes now follow one contract layer:

1. **Auth** — `getAuthenticatedContext()` (session + `shop_members` verification); unknown/anonymous → `401`; no active shop → `404`.
2. **Validation** — Zod schemas from `src/lib/validation/schemas.ts` for every write payload.
3. **CSRF** — `csrfMiddleware` (Origin/Host verification) on all mutations.
4. **Rate limiting** — `rateLimiters` on auth/payment-sensitive routes (auth, shop creation, invoice/transaction/document writes, MFA).
5. **Errors** — safe client messages only; internal detail logged server-side (repo-wide leak sweep).
6. **Auditing** — `audit_events` on material financial actions (shop creation, invoice create/review-state change, transactions import, reconciliation confirmation, GST summary generation).

---

## 2. Endpoint Contracts & Consumer Wiring

| Endpoint | Methods | UI Consumer | Contract Notes |
|----------|---------|-------------|----------------|
| `/api/shops` | GET, POST | Sidebar identity (dashboard, invoice-details, expense-capture, assistant, onboarding) | GET `{shop, isDemo}` / POST creation with audit event |
| `/api/shops/list` | GET | Business selector | Own-shops list only |
| `/api/shops/switch` | POST | Business selector | Membership verified (`shop_members`/owner); sets `dx_active_shop` |
| `/api/invoices` | GET, POST | Invoices page (list), review page, assistant context, dashboard, engine summaries | List `{ invoices }`; POST validated by invoice schema + arithmetic validation |
| `/api/invoices/[id]` | GET, PATCH, PUT, DELETE | Invoice-details (`GET`), review page (`PATCH` confirm actions), invoices page (`DELETE` with confirm dialog) | **Phase 2 additions:** GET rate-limited; PATCH review-state machine writes `invoice_review_state_changed`; safe errors |
| `/api/transactions` | GET, POST | Transactions page (CSV import), expense-capture (array-of-1 manual save), dashboard | **Phase 2:** POST Zod `importTransactionsSchema` + `bankTransactionInputSchema`; `transactionCategorySchema` enum covers expense-capture categories |
| `/api/documents` | GET, POST, DELETE | Documents page; expense-capture receipt upload | POST: MIME whitelist (jpeg/png/webp/heic/heif/pdf), 10 MB cap, content-hash dedupe, path `{shop_id}/{document_id}/{filename}`, `processing_status` gated for review |
| `/api/documents/[id]` | PATCH | Documents/review flows | Ownership-checked updates |
| `/api/documents/[id]/signed-url` | GET | Document viewers | Signed URL issued only after authorization check |
| `/api/gst/summary` | GET, POST | GST page, exports | **Phase 2:** POST recomputes via `generateGSTPeriodSummary` from the shop's own invoices — client-submitted figures are never persisted; `calculation_version`/`ruleset_version` stamped; audit on generation |
| `/api/reconciliation` | GET, POST | Reconciliation page, assistant context (real unresolved count) | GET `{ suggestions }`; POST `confirmMatchSchema`; same-shop enforced twice (route check + DB trigger) |
| `/api/reconciliation/history` | GET, DELETE | Reconciliation history | Membership re-verified on delete |
| `/api/exports` | GET | Exports page | `type=gstr3b_csv|gstr1_json&year&month`; server-engine data; CSV formula-injection sanitization; Content-Disposition filename parse; blob download |
| `/api/assistant` | POST | Assistant page | GNANI EVON; grounded context (shop name/GSTIN/period/unreconciled/open invoices); refuses non-financial requests; **never claims GSTN filing**; unconfigured key → explicit unavailable message |
| `/api/auth/signout` | POST | Header/logout actions | Teardown + `dx_active_shop` cleared |
| `/api/auth/mfa/enroll` | POST | Settings (security) | Real Supabase MFA enrollment |
| `/api/auth/mfa/challenge` | POST | Login MFA step | **Corrected:** client-supplied `factorId` (UUID) per Supabase semantics |
| `/api/auth/mfa/verify` | POST | Login MFA step | **Corrected:** `factorId` + `challengeId` + 6-digit code |
| `/api/auth/mfa/status` | GET | Settings/login | Enrollment status probe |
| `/api/auth/demo-session` | POST, DELETE | **None (UI disabled)** | Dev-only; login button disabled with tooltip; CSRF + 5/min rate limit from before |

---

## 3. Integration Rules Enforced in This Pass

| Rule | Mechanism | Verified By |
|------|-----------|-------------|
| Client payloads are never authoritative for computed money | GST summary POST recomputes server-side | Code review + `financial-integrity.test.ts` (engine determinism) |
| Shop scoping end-to-end | `ctx.shop.id` in every query; DB trigger `enforce_reconciliation_same_shop` | 13 RLS probes + route review |
| Cross-origin writes rejected | `csrfMiddleware` Origin/Host check | Route review (`src/lib/security/csrf.ts`) |
| Rate-limited sensitive routes | `rateLimiters.*` on auth/MFA/invoice/transaction/document writes | Route review |
| No-stack-trace responses | Repo-wide error sweep | Scripted scan + build/lint pass |
| Frontend reflects server truth | Invoices/review/document lists refresh from API after mutations; optimistic updates rollback on failure | Code review |
| Files validated before storage | Client mirrors server (`ALLOWED_DOCUMENT_TYPES`, 10 MB) — content-type based, not extension-based | Code review BOTH sides |
| CSV imports tracked | `import_batches` counters (rows/imported/skipped/duplicates/errors), `external_txn_id` dedupe | Route review |

---

## 4. Notable Integration Repairs (Phase 2)

1. **`DELETE /api/invoices/{id}`** — first UI consumer ever wired; confirm dialog + busy state + toast; optimistic list removal only after 2xx.
2. **`PATCH`-based review state machine** — review page confirmations persist through the API (previously persisted nothing); every transition audited.
3. **Manual expense → transactions** — `POST /api/transactions` with `{ transactions: [ ... ] }` (`direction:'debit'`, `source:'expense_capture'`, description ≤ 500 chars, server-validated) — expense-capture now actually records entries.
4. **Receipts → documents** — expense-capture uploads through `POST /api/documents` with `document_type: receipt`.
5. **Exports blob downloads** — replaced `window.location.href` navigation with `fetch` + Auth/CSRF-aware error handling, `Content-Disposition` filename, object-URL release, busy state.
6. **Real context for GNANI** — assistant pulls `GET /api/shops`, `GET /api/invoices`, `GET /api/reconciliation` (real detail: unreconciled suggestions count; open due totals computed with `money()` decimals).

---

## 5. Known Constraints

- **CSRF scheme:** Origin/Host verification (documented; assumes proxy-controlled Host — standard for this deployment).
- **Rate limiter:** per-process in-memory until Redis/Upstash is provisioned (`distributed-rate-limiter.ts` documented as dead code).
- **GNANI live key:** not configured in this environment — auth/session surfaces are exercised but live AI responses degrade to the explicit unavailable message.
- **Prerender-bailout console noise:** `/api/exports` and `/api/shops/list` correctly bail out of static prerendering; messages are expected build output, not failures (caught by route handlers).

---

## 6. Verdict

All 20 route files implement the contract layer; all consumers reach live endpoints; the write path is functional. No endpoint fabricates data; no endpoint trusts client-computed financial values.

**API Integration Rating: PASS**
