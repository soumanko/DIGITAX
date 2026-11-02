# DIGITAX — Engineering Baseline

**Phase:** Phase 0 — Repository Discovery and Baseline  
**Status:** COMPLETE (read-only discovery, no application code modified)  
**Date:** Mon Nov 02 2026  
**Git:** Not available in this environment (git binary not installed). Branch, status, and commit history could not be inspected via CLI.

---

## 1. Existing Architecture

### 1.1 Technology Stack

| Layer | Technology | Version | Source |
|-------|-----------|---------|--------|
| Framework | Next.js (App Router) | 16.4.1 | package.json |
| UI Library | React | 19.3.0 | package.json |
| Language | TypeScript | 5.x | package.json |
| Styling | Tailwind CSS | 4 | package.json |
| Backend/DB | Supabase (Auth + PostgreSQL + Storage) | @supabase/ssr ^0.12.7, @supabase/supabase-js ^2.117.3 | package.json |
| Validation | Zod | ^4.6.7 | package.json |
| Financial Math | decimal.js | ^10.6.0 | package.json |
| Testing | node:test + assert | Built-in | package.json (vitest ^5.0.4 listed as devDep but unused) |
| Icons | lucide-react | — | package.json |
| Utilities | clsx, tailwind-merge | — | package.json |

### 1.2 Directory Structure (verified)

```
DIGITAX/
├── opencode.json                          <-- Created during OpenCode config session
├── AGENTS.md                              <-- Next.js boilerplate + engineering instructions (appended)
├── .env.example                           <-- Safe placeholder env vars only
├── .env.local                             <-- Present (gitignored)
├── .gitignore                             <-- Excludes node_modules, .env*, .next, build
├── next.config.ts                         <-- Minimal Next.js config, Turbopack + Tailwind
├── package.json
├── package-lock.json
├── tsconfig.json                          <-- Strict mode, path alias @/*
├── eslint.config.mjs                      <-- Next.js ESLint config
├── next-env.d.ts
├── README.md
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql         <-- 1,110-line production migration
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── SEO_STRATEGY.md
├── public/                                <-- Static assets (SVG icons)
└── src/
    ├── app/
    │   ├── layout.tsx                     <-- Root layout, JSON-LD Organization schema
    │   ├── page.tsx                       <-- Landing page (marketing)
    │   ├── (auth)/login, register, reset-password, confirm
    │   ├── (dashboard)/dashboard, documents, transactions, reconciliation,
    │   │   gst, assistant, review, exports, settings, onboarding
    │   └── api/
    │       ├── shops (GET, POST)
    │       ├── invoices (GET, POST)
    │       ├── transactions (GET, POST)
    │       ├── reconciliation (GET, POST)
    │       ├── documents (POST)
    │       ├── exports (GET)
    │       ├── gst/summary (GET, POST)
    │       ├── assistant (POST)
    │       ├── auth/signout (POST)
    │       └── auth/confirm (GET)
    ├── components/layout/                 <-- dashboard-layout, marketing-layout
    ├── components/ui/                     <-- button, input, card, badge
    ├── lib/
    │   ├── supabase/                      <-- client, server, server-db, db, middleware
    │   ├── gst/calculator.ts              <-- GST calculation engine
    │   ├── ai/gnani.ts                    <-- GNANI EVON V3.3 AI assistant
    │   ├── csv-parser.ts                  <-- Bank statement CSV parser
    │   ├── decimal.ts                     <-- decimal.js wrappers (money, roundMoney, formatINR)
    │   ├── reconciliation/engine.ts       <-- Match suggestion engine
    │   ├── validation/schemas.ts          <-- Zod validation schemas
    │   ├── demo-data.ts                   <-- Hardcoded demo shop/invoices/transactions
    │   ├── utils.ts                       <-- cn() utility
    │   └── __tests__/                     <-- 3 test files (22 tests total)
    └── types/
        ├── database.ts                    <-- Supabase-generated DB types (1,121 lines)
        └── index.ts                       <-- Domain types (529 lines)
```

### 1.3 Database Schema (from migration 001_initial_schema.sql)

14 tenant tables, all with `shop_id` and RLS enabled:

| Table | Purpose | RLS | Key Constraints |
|-------|---------|-----|-----------------|
| profiles | User profile linked to auth.users | Yes | PK references auth.users(id) |
| shops | Business shop records | Yes | owner_id references auth.users(id) |
| shop_members | Authorization join table | Yes | UNIQUE(shop_id, user_id) |
| documents | File metadata for uploads | Yes | storage_path, content_hash |
| invoices | Sales/purchase invoices | Yes | NUMERIC(15,2) monetary, UNIQUE(shop_id, invoice_number, direction) |
| invoice_items | Line items | Yes | FK to invoices, UNIQUE(invoice_id, line_number) |
| import_batches | CSV import tracking | Yes | shop_id, imported_by |
| transactions | Bank/UPI transactions | Yes | UNIQUE(shop_id, external_txn_id) |
| reconciliation_matches | Invoice-transaction matches | Yes | Cross-shop enforcement trigger |
| filing_periods | Tax return periods | Yes | UNIQUE(shop_id, period_start, period_end, return_type) |
| gst_summaries | GST calculation snapshots | Yes | Versioned calculation ruleset |
| review_issues | Compliance review flags | Yes | Severity levels |
| audit_events | Append-only tamper-resistant log | Yes | Immutable triggers (no UPDATE/DELETE) |

Storage: Private `shop-documents` bucket (10MB limit, MIME-restricted, path convention `{shop_id}/{document_id}/{filename}`)

Security-definer functions: `is_shop_member(UUID)`, `is_shop_admin(UUID)`

---

## 2. Current Functionality (Verified by Source Inspection)

### 2.1 Authentication
- Email/password registration via Supabase Auth (`src/app/register/page.tsx`)
- Email confirmation OTP (`src/app/auth/confirm/route.ts`)
- Login via `supabase.auth.signInWithPassword` (`src/app/login/page.tsx`)
- Logout via `/api/auth/signout` route
- Password reset via `resetPasswordForEmail` (`src/app/reset-password/page.tsx`)
- Session middleware via `@supabase/ssr` (`src/lib/supabase/middleware.ts`)
- Protected routes: `/dashboard`, `/documents`, `/transactions`, `/reconciliation`, `/gst`, `/assistant`, `/review`, `/exports`, `/settings`, `/onboarding`

### 2.2 Multi-Tenant Isolation
- Every tenant table carries `shop_id`
- RLS policies on all 14 tables using `is_shop_member()` / `is_shop_admin()`
- `getAuthenticatedContext()` in `server-db.ts` verifies session and shop membership
- Server-side authorization before every protected API operation

### 2.3 Document Management
- Upload API at `/api/documents` (POST) — accepts file + document_type
- Validates file size (10MB) and MIME type (jpeg/png/webp/heic/heif/pdf)
- Stores to Supabase Storage, persists metadata to `documents` table
- Logs audit event on upload

### 2.4 Invoice Management
- Create invoice via `/api/invoices` (POST) with Zod validation
- List invoices via `/api/invoices` (GET)
- Manual invoice creation modal in Documents page
- Line items support with HSN/SAC codes, GST rates, tax breakdowns

### 2.5 Bank Transactions & CSV Import
- CSV parser (`src/lib/csv-parser.ts`) handles HDFC/ICICI/SBI formats
- Debit/credit columns, signed amounts, date normalization (DD/MM/YYYY, ISO)
- Quoted CSV fields, CRLF/LF handling
- Import via `/api/transactions` (POST)
- List transactions via `/api/transactions` (GET)

### 2.6 Reconciliation
- Match suggestion engine (`src/lib/reconciliation/engine.ts`)
- Scoring: exact amount, reference match, party name, date proximity
- Confirm match via `/api/reconciliation` (POST)
- Server-side atomic updates in `confirmReconciliationMatchServer`

### 2.7 GST Engine & Reporting
- `src/lib/gst/calculator.ts`: GSTIN validation, CGST/SGST/IGST, GSTR-1/GSTR-3B summaries
- `generateGSTPeriodSummary()` returns deterministic GSTR-1/GSTR-3B data
- Export: GSTR-1 JSON (`/api/exports?type=gstr1_json`), GSTR-3B CSV (`/api/exports?type=gstr3b_csv`)
- GST summary snapshot via `/api/gst/summary` (GET, POST)

### 2.8 GNANI AI Assistant
- `src/lib/ai/gnani.ts`: GNANI EVON V3.3 with intelligent fallback
- Multilingual: English, Hindi, Bengali, Marathi
- API at `/api/assistant` (POST)
- Falls back to hardcoded demo responses when API key unavailable

### 2.9 Frontend Pages
- Landing page with demo access button
- Login, Register, Reset Password, Confirm
- Dashboard with KPI cards, recent invoices, AI widget, review queue
- Documents with upload, search, filter, manual invoice modal, arithmetic inspector
- Transactions with CSV import, search, filter, reconciliation status
- Reconciliation with match suggestions, approve/dismiss, audit log
- GST workspace with GSTR-3B, GSTR-1, ITC ledger tabs
- Assistant with chat UI, voice input, language selector
- Review center with pending invoices, resolve actions
- Exports with GSTR-1 JSON, GSTR-3B CSV, CA audit package
- Settings with shop profile, GSTIN, taxpayer scheme, language, sign out
- Onboarding with shop profile setup

---

## 3. Confirmed Defects (15 Audit Findings)

### Critical (3)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| DIGITAX-001 | CRITICAL | `src/app/api/documents/route.ts:40` | Uploads to bucket `documents` but migration creates `shop-documents`. Storage RLS policies reference `shop-documents`. |
| DIGITAX-002 | CRITICAL | `src/app/api/documents/route.ts:52-67` | Inserts non-existent columns: `user_id`, `file_name`, `mime_type`, `ocr_confidence`. Actual schema has `uploader_id`, `uploaded_by`, `original_filename`, `content_type`. Uses `as any` bypass. |
| DIGITAX-003 | CRITICAL | `src/app/api/gst/summary/route.ts:53-76` | Inserts non-existent columns: `summary_type`, `outward_taxable_value`, `outward_igst`, `outward_cgst`, `outward_sgst`, `outward_cess`, `inward_taxable_value`, `itc_igst`, `itc_cgst`, `itc_sgst`, `itc_cess`, `return_data`. Actual schema has `taxable_sales`, `output_igst`, `output_cgst`, `output_sgst`, `output_cess`, `input_igst`, `input_cgst`, `input_sgst`, `input_cess`, `details`. Uses `as any` bypass. |

### High (4)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| DIGITAX-004 | HIGH | `src/app/api/invoices/route.ts:58-64` | Uses `parseFloat()` for tax total instead of `decimal.js`. Floating-point arithmetic for monetary values. |
| DIGITAX-005 | HIGH | `src/app/reconciliation/page.tsx:86-90` | Client updates local UI state even when server rejects match. State diverges from database. |
| DIGITAX-006 | HIGH | `src/lib/supabase/server-db.ts:160-216` | Invoice header and line items inserted in separate Supabase calls with no transaction. No rollback on line item failure. |
| DIGITAX-007 | HIGH | `src/app/login/page.tsx:51-55` | Demo session cookie set via `document.cookie` without `HttpOnly`/`Secure`. Multiple API routes bypass auth when cookie present in dev. |

### Medium (5)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| DIGITAX-008 | MEDIUM | `src/app/documents/page.tsx:113-117` | Manual invoice creation uses `parseFloat`/`*` for tax math instead of `decimal.js`. |
| DIGITAX-009 | MEDIUM | `src/lib/gst/calculator.ts:94` | GST date filtering uses `inv.invoice_date.startsWith(periodStr)` — fragile string comparison. |
| DIGITAX-010 | MEDIUM | `src/app/settings/page.tsx:84-99` | Shows "Settings Saved" toast even when API call fails. Swallows errors. |
| DIGITAX-011 | MEDIUM | Multiple (no implementation) | No rate limiting on login, registration, or expensive endpoints. SECURITY.md acknowledges this gap. |
| DIGITAX-012 | MEDIUM | `src/app/transactions/page.tsx:117-150` | Silent local-only fallback on API failure. Fabricates transactions with hardcoded demo shop_id. No audit trail. |

### Low (3)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| DIGITAX-013 | LOW | `src/app/settings/page.tsx`, `src/app/onboarding/page.tsx` | GSTIN accepted as free text. `gstinSchema` Zod validator exists but unused. |
| DIGITAX-014 | LOW | `src/app/api/exports/route.ts:89,110` | GSTIN embedded directly in filename without sanitization. |
| DIGITAX-015 | LOW | `src/app/documents/page.tsx` manual modal | `validateInvoiceArithmetic()` from `decimal.ts` exists but never called on manual invoice creation. |

---

## 4. Incomplete Features

| Feature | Status | Gap |
|---------|--------|-----|
| Document OCR extraction | MOCKED | No OCR provider integration. `processing_status: 'completed'` hardcoded. No extraction logic. |
| GST summary persistence | PARTIALLY BROKEN | POST route uses wrong column names (DIGITAX-003). |
| Document upload | PARTIALLY BROKEN | Wrong bucket (DIGITAX-001), wrong columns (DIGITAX-002). |
| Invoice editing/deletion | MISSING | No PUT/DELETE endpoints for invoices. |
| Document listing | MISSING | No GET endpoint for documents. Only POST upload. |
| GSTR-1/GSTR-3B API | PARTIAL | Export-only via `/api/exports`. No dedicated summary management API. |
| Reconciliation history | PARTIAL | No dedicated endpoint for match history. Only suggestions + confirm. |
| Settings persistence | PARTIALLY BROKEN | Silent error swallowing (DIGITAX-010). |
| CSV import reliability | PARTIALLY BROKEN | Local-only fallback on failure (DIGITAX-012). |
| Rate limiting | MISSING | Not implemented anywhere. |
| GSTIN validation on forms | MISSING | Validator exists but unused in forms (DIGITAX-013). |
| Pagination | MISSING | No pagination on invoice/transaction lists. |
| Composition scheme GST | MISSING | FAQ claims support but GST engine only handles regular scheme calculations. |
| Reverse charge | MISSING | Field exists in schema but no calculation logic. |
| Credit/Debit notes | MISSING | Document types exist but no calculation logic. |
| Voice (PRISMA/TIMBRE) | MOCKED | Browser Web Speech API only. No provider integration. |

---

## 5. Security Risks

| Risk | Severity | Location | Description |
|------|----------|----------|-------------|
| Demo session cookie | HIGH | `src/app/login/page.tsx:51-55` | Client-settable, no HttpOnly/Secure. Auth bypass in dev API routes. |
| Document storage bucket mismatch | CRITICAL | `src/app/api/documents/route.ts:40` | Uploads to non-RLS-protected bucket or fails entirely. |
| No rate limiting | MEDIUM | All API routes | Brute-force on login/register, DoS on imports. |
| Silent error suppression | MEDIUM | `settings/page.tsx:84-99`, `reset-password/page.tsx:25-26` | Errors swallowed, false success states. |
| `as any` type bypasses | CRITICAL | `documents/route.ts:65`, `gst/summary/route.ts:74` | Type safety bypassed, wrong column names reach database. |
| Client-trusted shop IDs | — | Mitigated by `getAuthenticatedContext()` | Server derives shop from session, not client input. Verified. |
| Service role key exposure | — | `server.ts:35-46` | Service client created server-side only. Not exposed to browser. Verified. |

---

## 6. Financial Integrity Risks

| Risk | Severity | Location | Description |
|------|----------|----------|-------------|
| Floating-point tax math | HIGH | `api/invoices/route.ts:58-64` | `parseFloat()` for monetary totals. Rounding errors accumulate. |
| Floating-point manual invoice | MEDIUM | `documents/page.tsx:113-117` | Manual invoice modal uses JS arithmetic for GST. |
| Non-atomic invoice creation | HIGH | `server-db.ts:160-216` | Invoice header + line items in separate calls. No rollback. |
| Silent reconciliation state divergence | HIGH | `reconciliation/page.tsx:86-90` | UI updates before server confirmation. |
| No invoice arithmetic validation | LOW | `documents/page.tsx` manual modal | `validateInvoiceArithmetic()` exists but unused. |
| Fragile GST date filtering | MEDIUM | `gst/calculator.ts:94` | String `startsWith()` for date period filtering. |

---

## 7. Test Coverage

**Test files:** 3 files in `src/lib/__tests__/`

| File | Tests | Coverage |
|------|-------|----------|
| `audit.test.ts` | 9 | Decimal formatting, rounding, GST components (intra/inter-state), GSTIN validation, Zod schemas, GSTR-1/GSTR-3B summaries, reconciliation matching, invoice arithmetic |
| `csv_parser.test.ts` | 3 | Multi-column statements, single-column signed amounts, malformed CSV rejection |
| `rls_isolation.test.ts` | 10 | Unauthenticated read/write rejection (5 tables), cross-shop integrity, storage path convention, audit immutability |

**Total:** 22 tests across 3 suites, all passing (verified via `npm test`).

**Test gaps:**
- No API route tests
- No integration tests
- No Playwright/E2E tests
- RLS tests 8-10 are structural invariants, not live database tests
- No tests for composition scheme, reverse charge, cess, inter-state GST
- No tests for document upload or GST summary persistence
- No tests for the broken documents API

---

## 8. Dependencies

**Production dependencies (from package.json):**
- @hookform/resolvers ^5.9.1
- @supabase/ssr ^0.12.7
- @supabase/supabase-js ^2.117.3
- class-variance-authority ^0.7.1
- clsx ^2.1.1
- date-fns ^4.4.0
- decimal.js ^10.6.0
- lucide-react ^1.57.0
- next 16.4.1
- react 19.3.0
- react-dom 19.3.0
- react-hook-form ^7.90.0
- recharts ^3.10.1
- tailwind-merge ^3.7.0
- uuid ^14.0.3
- zod ^4.6.7

**Dev dependencies:**
- @tailwindcss/turbopack ^4
- @testing-library/jest-dom ^7.0.1
- @testing-library/react ^16.3.3
- @types/node ^20
- @types/react ^19
- @types/react-dom ^19
- @types/uuid ^10.0.0
- eslint ^9
- eslint-config-next 16.4.1
- tailwindcss ^4
- typescript ^5
- vitest ^5.0.4 (listed but not used; tests use node:test)

---

## 9. Environment Configuration

**Required environment variables (from .env.example):**

| Variable | Purpose | Public? |
|----------|---------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (server-only) | No |
| NEXT_PUBLIC_APP_URL | Application URL | Yes |
| NEXT_PUBLIC_APP_NAME | Application name | Yes |
| GNANI_EVON_API_KEY | GNANI AI API key | No |
| GNANI_EVON_API_URL | GNANI API endpoint | No |
| GNANI_EVON_MODEL_ID | GNANI model ID | No |
| GNANI_PRISMA_API_KEY | Speech-to-Text API key | No |
| GNANI_TIMBRE_API_KEY | Text-to-Speech API key | No |
| OCR_PROVIDER | OCR provider (google-vision, azure-ai, tesseract-local) | No |
| GOOGLE_VISION_API_KEY | Google Vision API key | No |
| AZURE_AI_ENDPOINT | Azure AI endpoint | No |
| AZURE_AI_KEY | Azure AI key | No |
| REDIS_URL | Redis for background jobs | No |
| SENTRY_DSN | Error monitoring | No |
| NEXT_PUBLIC_ANALYTICS_ID | Analytics ID | Yes |

**Security:** `.env*` files are gitignored. `.env.example` contains only placeholder names. No secrets hardcoded in source (verified by grep).

---

## 10. Implementation Priorities

### Phase 1: Fix Critical Write Operations (Week 1)
1. Fix documents API: correct bucket name (`shop-documents`) and column names
2. Fix GST summary POST: map to actual `gst_summaries` columns
3. Remove all `as any` type bypasses in API routes
4. Replace `parseFloat` with `decimal.js` in invoice API

### Phase 2: Data Integrity & Atomicity (Week 2)
5. Implement transaction atomicity for invoice creation
6. Fix reconciliation client to only update on server success
7. Add `validateInvoiceArithmetic()` to manual invoice creation
8. Add GSTIN validation to settings and onboarding forms

### Phase 3: Security Hardening (Week 3)
9. Replace client-side demo cookie with server-side HttpOnly cookie
10. Remove demo auth bypass from API routes
11. Implement rate limiting
12. Sanitize GSTIN in export filenames

### Phase 4: Document Management & OCR (Week 4)
13. Fix document upload pipeline end-to-end
14. Implement OCR provider abstraction
15. Add manual document processing path
16. Add document listing API

### Phase 5: Invoice Management (Week 5)
16. Add invoice editing/deletion with audit
17. Add duplicate invoice prevention
18. Server-side arithmetic as authoritative source

### Phase 6: Bank Transactions & CSV Import (Week 6)
19. Remove silent local fallback
20. Add import batch tracking with error details
21. Add duplicate detection strategy

### Phase 7: Reconciliation (Week 7)
22. Atomic reconciliation updates
23. Prevent duplicate matches and race conditions
24. Add match history API

### Phase 8: GST Engine & Reporting (Week 8)
25. Fix GST summary persistence
26. Server-side recomputation of summaries
27. Add composition scheme support
28. Add reverse charge and credit/debit note logic

### Phase 9: GNANI AI (Week 9)
29. Remove hardcoded fallback responses
30. Implement server-side tools for business data queries
31. Add tenant authorization to all tools

### Phase 10: Dashboard & Frontend (Week 10)
31. Loading/empty/error states on all data screens
32. Remove demo data fallbacks
33. Real data from authenticated sources only

### Phase 11: Reports & Audit Package (Week 11)
34. Replace static mock CA audit package with real data
35. Remove "Certified Ready" claims without verification

### Phase 12: Settings (Week 12)
36. Server-side validation for all settings changes
37. Remove localStorage-only fallbacks

### Phase 13: Security Hardening (Week 13)
38. Complete security review
39. Rate limiting implementation
40. Error handling without stack trace leakage

### Phase 14: Testing (Week 14)
41. API route tests for all 10 routes
42. Database/RLS tests
43. Integration tests for critical workflows
44. Regression tests for all 15 findings

### Phase 15: Build & Deployment (Week 15)
42. TypeScript compilation check
43. ESLint check
44. Production build
45. Environment configuration guide

### Phase 16: Documentation (Week 16)
46. Update README, ARCHITECTURE, ENGINEERING_BASELINE
47. Create IMPLEMENTATION_REPORT, TESTING_GUIDE, DEPLOYMENT_GUIDE
48. Create DATABASE_SETUP, API_REFERENCE, ENVIRONMENT_CONFIGURATION, KNOWN_LIMITATIONS

---

## 11. Verification Notes

- Git is not installed in this environment. Branch, `git status`, and commit history could not be inspected. All file reads were performed directly on the filesystem.
- The 15 audit findings were verified by reading the actual source code of each implicated file.
- Test suite (22 tests) was executed and all pass.
- No application source files were modified during this discovery phase.
- `opencode.json` and `AGENTS.md` were modified in a prior session (OpenCode configuration), not during this discovery phase.

---

## 12. Next Steps

Proceed to Phase 1: Authentication and Multi-Tenant Security. Begin by fixing DIGITAX-007 (demo session cookie) and verifying tenant isolation across all API routes.