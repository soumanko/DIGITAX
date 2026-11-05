# DIGITAX — Production Readiness Guide

**Date:** Mon Nov 04 2026  
**Status:** READY WITH DOCUMENTED LIMITATIONS

## 1. Build Status

| Check | Result |
|-------|--------|
| `npm test` | 25/25 PASS |
| `npx tsc --noEmit` | PASS (0 errors) |
| `npm run lint` | PASS (0 errors, 143 warnings) |
| `npm run build` | PASS |

## 2. Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Supabase service role key (server-side only) | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | YES | Application URL | `https://digitax.example.com` |
| `NEXT_PUBLIC_APP_NAME` | YES | Application name | `DIGITAX` |
| `GNANI_EVON_API_KEY` | NO | GNANI AI assistant API key | Optional |
| `GNANI_EVON_API_URL` | NO | GNANI API endpoint | Optional |
| `GNANI_EVON_MODEL_ID` | NO | GNANI model ID | Optional |
| `OCR_PROVIDER` | NO | OCR provider (`tesseract-local`, `google-vision`, `azure-ai`) | Optional |
| `REDIS_URL` | NO | Redis URL for rate limiting | Optional |
| `SENTRY_DSN` | NO | Error monitoring DSN | Optional |

**Important:** `.env.local` currently contains `demo-digitax.supabase.co` which is NOT a valid Supabase project URL. You must replace it with your actual Supabase project URL before deployment.

## 3. Database Setup

### Required Migrations (apply in order)
1. `supabase/migrations/001_initial_schema.sql` — Core schema with RLS
2. `supabase/migrations/002_atomic_invoice_creation.sql` — Atomic invoice creation
3. `supabase/migrations/003_secure_atomic_invoice_creation.sql` — Secure atomic invoice creation

### Required Supabase Resources
| Resource | Purpose |
|----------|---------|
| `shop-documents` storage bucket | Private bucket for document uploads (10MB limit) |
| RLS policies on all 14 tables | Multi-tenant isolation |
| Security-definer functions | Secure database operations |

## 4. Deployment Checklist

### Pre-Deployment
- [] Provision Supabase project
- [ ] Apply migrations 001, 002, 003
- [ ] Configure environment variables
- [ ] Verify storage bucket `shop-documents` exists
- [ ] Verify RLS policies are active on all tables
- [ ] Test authentication flow
- [ ] Test invoice creation
- [ ] Test document upload
- [ ] Test CSV import
- [ ] Test reconciliation
- [ ] Test GST summary generation
- [ ] Test exports

### Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor API response times
- [ ] Monitor database query performance
- [ ] Review audit logs regularly
- [ ] Rotate secrets periodically

## 5. Production Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| In-memory rate limiter | Not suitable for production serverless (state lost across invocations) | Use Redis or edge-level rate limiting |
| OCR provider not integrated | Documents require manual processing | Configure `OCR_PROVIDER` and API keys |
| GNANI AI requires API key | AI assistant returns "unavailable" without key | Configure `GNANI_EVON_API_KEY` |
| No integration/E2E tests | Only unit tests exist | Add Playwright or similar for E2E testing |
| No composition scheme GST | Composition scheme businesses cannot use GST features | Implement composition scheme calculations |
| No reverse charge mechanism | Reverse charge supplies not supported | Implement reverse charge logic |
| No credit/debit note processing | Credit/debit notes not supported | Implement credit/debit note logic |

## 6. Security Checklist for Production

- [ ] All `.env*` files are gitignored
- [ ] No hardcoded API keys or secrets in source code
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to browser
- RLS policies are enabled on all tenant tables
- Storage bucket `shop-documents` is private
- Rate limiting is configured (consider Redis for production)
- Error messages don't expose internal details
- Security headers are set (X-Content-Type-Options, X-Frame-Options, etc.)

## 7. Required External Services

| Service | Purpose | Required |
|---------|---------|----------|
| Supabase | Database, Auth, Storage | YES |
| GNANI EVON API | AI assistant | Optional |
| OCR Provider (Google Vision, Azure AI, Tesseract) | Document OCR | Optional |
| Redis | Production rate limiting | Recommended |
| Sentry | Error monitoring | Optional |

## 8. Known Limitations for Production

1. **In-memory rate limiter** — Not suitable for multi-instance deployments. Use Redis or edge-level rate limiting for production.
2. **No OCR integration** — Documents must be manually processed until an OCR provider is configured.
3. **No GNANI API key** — AI assistant returns "service unavailable" message.
4. **Composition scheme GST** — Not supported; only regular taxpayer scheme calculations.
5. **No credit/debit note processing** — Document types exist but no calculation logic.
6. **No GSTN integration** — DIGITAX prepares returns for export; does not file directly to GSTN portal.
