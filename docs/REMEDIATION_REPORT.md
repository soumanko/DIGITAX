# DIGITAX — Remediation Report

**Date:** Mon Nov 04 2026  
**Total findings addressed:** 15  
**Fixes applied:** 15  
**Verified:** 3 PASS (runtime), 12 NOT VERIFIED (require live Supabase)

## Summary Table

| ID | Severity | Issue | Fix Applied | File(s) Modified | Verified |
|----|----------|-------|-------------|------------------|----------|
| DIGITAX-001 | CRITICAL | Documents API uploads to wrong bucket `documents` instead of `shop-documents` | Changed bucket name to `shop-documents` | `src/app/api/documents/route.ts` | NOT VERIFIED |
| DIGITAX-002 | CRITICAL | Documents API inserts non-existent columns with `as any` bypass | Fixed column names (`uploader_id`, `uploaded_by`, `original_filename`, `content_type`), removed `as any`, added proper error handling | `src/app/api/documents/route.ts` | NOT VERIFIED |
| DIGITAX-003 | CRITICAL | GST summary API inserts non-existent columns with `as any` bypass | Fixed column names (`taxable_sales`, `output_cgst`, etc.), removed `as any` | `src/app/api/gst/summary/route.ts` | NOT VERIFIED |
| DIGITAX-004 | HIGH | Invoice API uses `parseFloat()` for tax total | Replaced with `decimal.js` `roundMoney(money().plus())` | `src/app/api/invoices/route.ts` | PASS |
| DIGITAX-005 | HIGH | Reconciliation UI updates local state despite server errors | Only updates UI when `res.ok` is true | `src/app/reconciliation/page.tsx` | NOT VERIFIED |
| DIGITAX-006 | HIGH | Invoice creation not atomic (separate header + line item inserts) | Created `create_invoice_atomic` RPC function with SECURITY DEFINER; uses `supabase.rpc()` | `supabase/migrations/003_secure_atomic_invoice_creation.sql`, `src/lib/supabase/server-db.ts`, `src/lib/supabase/db.ts` | NOT VERIFIED |
| DIGITAX-007 | HIGH | Demo session cookie set client-side without HttpOnly/Secure | Created server-side API route `src/app/api/auth/demo-session/route.ts` with HttpOnly cookie | `src/app/api/auth/demo-session/route.ts`, `src/app/login/page.tsx`, `src/app/page.tsx` | NOT VERIFIED |
| DIGITAX-008 | MEDIUM | Manual invoice creation uses `parseFloat` for tax math | Replaced with `decimal.js` `money()`/`calculateGSTComponents()` | `src/app/documents/page.tsx` | PASS |
| DIGITAX-009 | MEDIUM | GST date filtering uses fragile `startsWith()` | Replaced with date range comparison (`invDate >= periodStart && invDate <= periodEnd`) | `src/lib/gst/calculator.ts` | PASS |
| DIGITAX-010 | MEDIUM | Settings page shows success despite API failure | Checks `res.ok`, shows error on failure, only shows success on server confirmation | `src/app/settings/page.tsx` | NOT VERIFIED |
| DIGITAX-011 | MEDIUM | No rate limiting on API endpoints | Created `src/lib/rate-limiter.ts` with sliding window; applied to 8 API routes | `src/lib/rate-limiter.ts`, 8 API route files | NOT VERIFIED |
| DIGITAX-012 | MEDIUM | Silent local-only CSV fallback on import failure | Removed fallback; shows error to user when API fails | `src/app/transactions/page.tsx` | NOT VERIFIED |
| DIGITAX-013 | LOW | No GSTIN validation on forms | Added `gstinSchema` validation to settings and onboarding forms | `src/app/settings/page.tsx`, `src/app/onboarding/page.tsx` | NOT VERIFIED |
| DIGITAX-014 | LOW | Unsantized export filenames | GSTIN sanitized with `.replace(/[^a-zA-Z0-9]/g, '_')` | `src/app/api/exports/route.ts` | NOT VERIFIED |
| DIGITAX-015 | LOW | Manual invoice creation skips arithmetic validation | Added `validateInvoiceArithmetic()` call before saving | `src/app/documents/page.tsx` | PASS |

## Additional Improvements Beyond Original Findings

| Area | Change | File(s) |
|------|--------|---------|
| TypeScript safety | Removed all `as any` casts from `src/lib/supabase/db.ts` | `src/lib/supabase/db.ts` |
| TypeScript safety | Fixed `any[]` types in dashboard to `Record<string, unknown>[]` / `Invoice[]` | `src/app/dashboard/page.tsx` |
| TypeScript safety | Fixed `any` types in assistant page | `src/app/app/assistant/page.tsx` |
| TypeScript safety | Fixed `any` types in API routes | `src/app/api/*.route.ts` |
| TypeScript safety | Added `ZodError` import for proper error handling | `src/app/api/invoices/route.ts`, `src/app/api/invoices/[id]/route.ts`, `src/app/api/shops/route.ts`, `src/app/api/reconciliation/route.ts` |
| Financial precision | Dashboard calculations use `decimal.js` instead of `parseFloat` | `src/app/dashboard/page.tsx` |
| Document upload | Added proper error handling with file cleanup on DB failure | `src/app/api/documents/route.ts` |
| Config validation | Added `src/lib/supabase/config-validation.ts` with placeholder detection | `src/lib/supabase/config-validation.ts` |
| Config validation | Added `requireSupabaseConfig()` calls to all Supabase client creators | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts` |

## Verification Results

| Check | Result |
|-------|--------|
| `npm test` | 25/25 PASS |
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm run lint` | 0 errors, 143 warnings |
| `npm run build` | PASS |

## Not Verified (Requires Live Supabase)

The following fixes cannot be validated at runtime without Supabase credentials:
- DIGITAX-001: Documents bucket `shop-documents`
- DIGITAX-002: Document metadata columns
- DIGITAX-003: GST summary columns
- DIGITAX-005: Reconciliation UI state sync
- DIGITAX-006: Atomic invoice creation RPC
- DIGITAX-007: Demo session cookie security
- DIGITAX-010: Settings error handling
- DIGITAX-011: Rate limiting at runtime
- DIGITAX-012: CSV import error handling
- DIGITAX-013: GSTIN form validation
- DIGITAX-014: Export filename sanitization
