# DIGITAX Recovery Baseline Report

## Date: 2026-11-09
## Repository: D:\DIGITAX
## Git HEAD: d9af8ce (v2.0)

---

## 1. Original Architecture (Secure Baseline: c0e5627 "Secure auth and tenant isolation")

### Authentication
- **Login** (`src/app/login/page.tsx`): Uses `supabase.auth.signInWithPassword()` with optional demo sign-in button calling `/api/auth/demo-session`
- **Register** (`src/app/register/page.tsx`): Uses `supabase.auth.signUp()` with email/password validation via Zod
- **Sign-in** (`src/app/sign-in/page.tsx`): Did NOT exist in c0e5627 (newly added in later commits)
- **Middleware** (`src/lib/supabase/middleware.ts`): Uses `createServerClient` from `@supabase/ssr`, calls `supabase.auth.getUser()`, redirects unauthenticated users to `/login`, redirects authenticated users away from auth pages
- **Supabase clients**: Browser client (`createClient` in `src/lib/supabase/client.ts`), Server client (`createClient` in `src/lib/supabase/server.ts`), Service client (`createServiceClient` in `src/lib/supabase/server.ts`)
- **Server DB layer** (`src/lib/supabase/server-db.ts`): `getAuthenticatedContext()` verifies user session and shop membership via `shop_members` table; `createShopWithMembership()` creates shop + membership atomically

### Multi-tenant Data Model
- `shops` table with `owner_id`, `name`, `gstin`, `state_code`, etc.
- `shop_members` table linking `user_id` to `shop_id` with `role`
- All business tables (`invoices`, `transactions`, `documents`, `gst_summaries`, etc.) have `shop_id` foreign key
- RLS policies enforce tenant isolation

### Demo Mode (isolated)
- Demo session via `dx_demo_session` cookie, only in non-production
- Demo data served only when cookie is present AND `NODE_ENV !== 'production'`
- Demo user ID: `demo-user-local-dev` (clearly synthetic)

---

## 2. Current Architecture (HEAD: d9af8ce "v2.0")

### Authentication
- **Login**: Uses real `signInWithPassword()` (unchanged from baseline)
- **Register**: Uses real `signUp()` (unchanged from baseline)
- **Sign-in** (NEW): Uses real `signInWithPassword()` BUT has fake "Continue with Google" button that does `router.push('/dashboard')` without authentication
- **Middleware**: Same as baseline BUT adds demo user creation when `dx_demo_session` cookie is present
- **Supabase clients**: Unchanged from baseline

### Demo Contamination (NEW - introduced after c0e5627)
- `src/lib/demo-data.ts`: Hardcoded `DEMO_SHOP` (shop-demo-001), `DEMO_INVOICES` (5 invoices), `DEMO_TRANSACTIONS` (5 transactions)
- `src/lib/demo-businesses/config.ts`: Hardcoded demo businesses (FreshMart, GrandMart)
- `src/lib/demo-businesses/customers.ts`: Hardcoded demo customers
- `src/lib/demo-businesses/suppliers.ts`: Hardcoded demo suppliers
- Multiple seed scripts in `scripts/` directory

### API Routes with Demo Data Fallbacks (NEW)
| Route | Demo Data Source | Condition |
|-------|-----------------|-----------|
| `api/shops/route.ts` | `DEMO_SHOP` | `dx_demo_session` cookie + dev |
| `api/transactions/route.ts` | `DEMO_TRANSACTIONS` | `dx_demo_session` cookie + dev |
| `api/invoices/route.ts` | `DEMO_INVOICES` | `dx_demo_session` cookie + dev |
| `api/reconciliation/route.ts` | `DEMO_INVOICES, DEMO_TRANSACTIONS` | `dx_demo_session` cookie + dev |
| `api/gst/summary/route.ts` | `DEMO_SHOP, DEMO_INVOICES` | `dx_demo_session` cookie + dev |
| `api/exports/route.ts` | `DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS` | `dx_demo_session` cookie + dev |
| `api/assistant/route.ts` | `DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS` | `dx_demo_session` cookie + dev |

### Pages Using Demo Data (NEW)
- `src/app/review/page.tsx`: Uses `DEMO_INVOICES` as initial state
- `src/app/dashboard/page.tsx`: Shows hardcoded mock data (Aster Labs Pvt. Ltd., Ananya Kapoor, etc.) - NOT connected to backend
- `src/app/onboarding/page.tsx`: Falls back to hardcoded demo shop `shop-demo-001` when shop creation fails + demo cookie

### Environment Configuration
- `.env.local`: Real Supabase URL (`xkmhmnibzketrsrenwdy.supabase.co`), real anon key, real service role key
- `.env.example`: Placeholder values

---

## 3. Changes Introduced During Demo Development

### Files Added (demo contamination)
1. `src/lib/demo-data.ts` - Hardcoded demo shop, invoices, transactions
2. `src/lib/demo-businesses/config.ts` - Demo business configurations
3. `src/lib/demo-businesses/customers.ts` - Demo customer data
4. `src/lib/demo-businesses/suppliers.ts` - Demo supplier data
5. `src/app/sign-in/page.tsx` - New sign-in page with fake Google auth
6. Multiple seed scripts in `scripts/` directory
7. Multiple demo documentation files in `docs/` directory

### Files Modified (demo contamination)
1. `src/lib/supabase/middleware.ts` - Added demo user creation logic
2. `src/app/api/shops/route.ts` - Added demo data fallback
3. `src/app/api/transactions/route.ts` - Added demo data fallback
4. `src/app/api/invoices/route.ts` - Added demo data fallback
5. `src/app/api/reconciliation/route.ts` - Added demo data fallback
6. `src/app/api/gst/summary/route.ts` - Added demo data fallback
7. `src/app/api/exports/route.ts` - Added demo data fallback
8. `src/app/api/assistant/route.ts` - Added demo data fallback
9. `src/app/dashboard/page.tsx` - Complete redesign with hardcoded mock data
10. `src/app/login/page.tsx` - Visual redesign (auth logic preserved)
11. `src/app/register/page.tsx` - Visual redesign (auth logic preserved)
12. `src/app/onboarding/page.tsx` - Added demo fallback logic
13. `src/app/layout.tsx` - Design changes

### Files Unchanged (auth logic preserved)
1. `src/lib/supabase/client.ts` - Real Supabase browser client
2. `src/lib/supabase/server.ts` - Real Supabase server client
3. `src/lib/supabase/config-validation.ts` - Config validation
4. `src/lib/supabase/server-db.ts` - Real server DB operations with RLS enforcement
5. `src/app/login/page.tsx` - Uses real `signInWithPassword()`
6. `src/app/register/page.tsx` - Uses real `signUp()`

---

## 4. Regressions Identified

### Critical: Authentication Bypass
- **`src/app/sign-in/page.tsx`** line 216: "Continue with Google" button does `router.push('/dashboard')` without any Supabase Auth call. Any user can access the dashboard without authentication.

### Critical: Demo Data Contamination
- Demo data is embedded in application code and served by API routes when `dx_demo_session` cookie is present
- Dashboard displays hardcoded mock data regardless of authenticated user
- Review page uses `DEMO_INVOICES` directly as initial state

### High: Middleware Demo User Creation
- `src/lib/supabase/middleware.ts` lines 43-46, 51-52: Creates `demo-user-local-dev` mock user when demo cookie is set in dev mode, bypassing real Supabase Auth

### High: Onboarding Demo Fallback
- `src/app/onboarding/page.tsx` lines 112-118: Falls back to hardcoded demo shop `shop-demo-001` when shop creation API returns 401 AND demo cookie is present

### Medium: Demo Data Files in Production Code
- Demo business config, customers, and suppliers are imported in production code paths

---

## 5. Files Requiring Restoration

### Authentication fixes:
1. `src/app/sign-in/page.tsx` - Remove fake Google auth, implement real Google OAuth or remove button
2. `src/lib/supabase/middleware.ts` - Remove demo user creation logic
3. `src/app/api/auth/demo-session/route.ts` - Ensure demo mode is strictly isolated

### API route fixes (remove demo data fallbacks):
4. `src/app/api/shops/route.ts` - Remove `DEMO_SHOP` import and demo cookie check
5. `src/app/api/transactions/route.ts` - Remove `DEMO_TRANSACTIONS` import and demo cookie check
6. `src/app/api/invoices/route.ts` - Remove `DEMO_INVOICES` import and demo cookie check
7. `src/app/api/reconciliation/route.ts` - Remove demo data import and demo cookie check
8. `src/app/api/gst/summary/route.ts` - Remove `DEMO_SHOP, DEMO_INVOICES` import and demo cookie check
9. `src/app/api/exports/route.ts` - Remove demo data import and demo cookie check
10. `src/app/api/assistant/route.ts` - Remove demo data import and demo cookie check

### Page fixes:
11. `src/app/dashboard/page.tsx` - Connect to real backend APIs instead of hardcoded mock data
12. `src/app/review/page.tsx` - Remove `DEMO_INVOICES` usage
13. `src/app/onboarding/page.tsx` - Remove demo fallback logic

### Data isolation:
14. `src/lib/demo-data.ts` - Mark as dev-only or remove from production imports
15. `src/lib/demo-businesses/*` - Mark as dev-only or remove from production imports

---

## 6. Database and Security Risks

| Risk | Severity | Description |
|------|----------|-------------|
| Auth bypass via Google button | Critical | `router.push('/dashboard')` without Supabase Auth |
| Mock user in middleware | High | `demo-user-local-dev` bypasses real auth when demo cookie present |
| Demo data in API routes | High | Hardcoded demo data served instead of real user data |
| Onboarding demo fallback | Medium | Hardcoded demo shop assigned on failure |
| Dashboard hardcoded data | Medium | Mock financial data presented as real |
| Demo data files in production | Low | Demo data embedded in application code |

---

## 7. Root Cause of Dummy Account Redirection

The root cause is multi-faceted:

1. **Sign-in page auth bypass**: The "Continue with Google" button in `src/app/sign-in/page.tsx` navigates directly to `/dashboard` without calling Supabase Auth, allowing unauthenticated access.

2. **Dashboard hardcoded mock data**: The dashboard displays "Aster Labs Pvt. Ltd." and "Ananya Kapoor" with hardcoded financial figures, giving the appearance of being logged into a demo account regardless of actual authentication state.

3. **Demo data API fallbacks**: When the `dx_demo_session` cookie is present (set via explicit POST to `/api/auth/demo-session`), API routes return hardcoded demo data instead of querying the real database for the authenticated user's data.

4. **Middleware mock user**: The middleware creates a `demo-user-local-dev` mock user when the demo cookie is present, which can override real authentication in dev mode.

Normal user registration and login via Supabase Auth (`signInWithPassword`, `signUp`) are functionally correct in the login and register pages. The issue is that post-login, the application presents mock/demo data instead of the user's real data, and the sign-in page has an unauthenticated bypass.

---

## 8. Required Actions

1. Remove fake Google auth from sign-in page
2. Remove demo user creation from middleware
3. Remove demo data fallbacks from all API routes
4. Remove demo fallback from onboarding page
5. Remove DEMO_INVOICES from review page
6. Connect dashboard to real backend APIs
7. Isolate demo data files from production code
8. Run full test suite and build verification

---

## 4. Phase 2 Baseline Updates (2026-11-09)

The full-codebase re-audit discovered issues beyond the Phase 1 scope. Baseline deltas from this pass:

### Before Phase 2 → After Phase 2

| Metric | Before | After |
|--------|--------|-------|
| Automated tests | 25 | **44** (8 suites, incl. new 19-test financial-integrity suite + 13 live RLS probes) |
| Lint | 0 errors / ~140 warnings | **0 errors / 126 warnings** (2 real react-hooks defects found and fixed) |
| `npx tsc --noEmit` | PASS | PASS |
| `npm run build` | PASS | PASS (Next.js 16.4.1; dynamic API-route prerender-bailout messages expected and handled) |
| Mutation endpoints usable | **NO** (CSRF token never issued → all writes 403) | **YES** (Origin/Host verification) |
| Invoice UI actions | Dead buttons | View → `/invoice-details?id=…`, Delete → `DELETE /api/invoices/{id}` |

### Newly-Discovered Baseline Items (all remediated this pass)

1. **CSRF write-path failure** — `csrfMiddleware` token mode with no issuing path: every cookie-authenticated mutation returned 403. Rebuilt as Origin/Host verification (`src/lib/security/csrf.ts`).
2. **`src/app/invoice-details/page.tsx`** — entirely static mock invoice ("Aster Labs"/"Tata Communications"), unreachable from the invoices page; ignored `?id=`. Rewritten to fetch `GET /api/invoices/{id}` with an explicitly-labelled Sample mode when no id.
3. **`src/app/exports/page.tsx`** — loading state never resolved; export cards permanently unreachable skeletons. Fixed + real download flow.
4. **`src/app/invoices/page.tsx`** — duplicated fetch effect; View/Delete rows rendered but did nothing.
5. **`src/app/expense-capture/page.tsx`** — static mock page; Save persisted nothing; placeholder mock merchant defaults.
6. **`src/app/review/page.tsx`** — fabricated audit-log rows and reviewer; replaced with real confirmations + real user email.
7. **`src/app/dashboard/page.tsx`** — fabricated KPI deltas (+12.8%/−4.2%), hardcoded chart (Jan–Jun), hardcoded due date/72% completion; all now derived from real data.
8. **`src/app/onboarding/page.tsx`** — pre-filled demo business defaults.
9. **`/invoices`, `/invoice-details`, `/expense-capture`** missing from middleware protected list.
10. **MFA routes** — wrong Supabase semantics + unbound references; error-leak sweep across API routes; signout leaves `dx_active_shop`.

### Phase 2 Completion State

- All Phase 1 remediation items remain in place; demo artifacts still isolated/dev-only (unchanged status — see sections 2–3).
- Reports extended: SECURITY_AUDIT_REPORT.md, AUTHENTICATION_TEST_REPORT.md, MULTITENANT_ISOLATION_REPORT.md, FRONTEND_VISUAL_REGRESSION_REPORT.md (+6-new-file set: FULL_CODEBASE_AUDIT, API_INTEGRATION, FINANCIAL_INTEGRITY, FINAL_ACCEPTANCE).
- Screenshot evidence: `docs/screenshots/` (10 captures + capture-results.json).