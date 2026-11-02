<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DIGITAX — Project Engineering Instructions

This file contains project-specific engineering guidance for agents working on the DIGITAX codebase. It supplements (does not replace) the auto-generated Next.js agent rules above.

## 1. Authentication and Supabase Row Level Security (top priority)
- All protected routes are verified server-side via Supabase Auth (`@supabase/ssr`) in `src/middleware.ts` and `src/lib/supabase/server.ts`. Never trust client-supplied user/session data.
- Use `createClient()` (anon key, cookie-based session) for user-scoped operations; use `createServiceClient()` (service role key) **only** server-side for elevated operations, and never expose it to the browser.
- Every tenant table has Row Level Security (RLS) enabled and relies on `auth.uid()` / `is_shop_member()` / `is_shop_admin()`. Do not bypass RLS. Add or modify RLS policies only through the migration process — never by editing application code to skip authorization.
- `audit_events` is append-only and immutable (database triggers reject UPDATE/DELETE). Never write code that attempts to update or delete audit rows.
- Log an `audit_events` entry for material financial actions (shop creation, invoice creation, transaction import, reconciliation confirmation, GST summary generation).

## 2. Strict multi-tenant data isolation
- Every tenant record carries a `shop_id` (shops, documents, invoices, invoice_items, transactions, reconciliation_matches, filing_periods, gst_summaries, review_issues, audit_events). Always scope queries by `shop_id`.
- Cross-shop operations are strictly forbidden. Reconciliation matches must link a transaction and invoice belonging to the same shop (enforced by the `enforce_reconciliation_same_shop` trigger). Never create cross-shop matches.
- Server-side authorization: verify the authenticated user owns or is a member of the target shop (`shop_members`) before any read/write. `getAuthenticatedContext()` in `src/lib/supabase/server-db.ts` is the reference implementation.
- Storage: documents go to the private `shop-documents` bucket under `{shop_id}/{document_id}/{filename}`. Access is RLS-controlled by shop. Use signed URLs for authorized access only.

## 3. Financial calculation accuracy
- Never use JavaScript floating-point (`number`) for authoritative money. Use `decimal.js` via the `money()` / `roundMoney()` helpers in `src/lib/decimal.ts` (precision 20, `ROUND_HALF_UP`).
- Database monetary columns are `NUMERIC(15, 2)`. Keep all money values as strings/Decimals through the stack; only format for display (`formatINR`).
- GST rounding: use `roundMoney()` (2 decimals, half-up). Intra-state supply splits tax equally into CGST + SGST; inter-state supply uses IGST only. Validate GSTIN with `validateGSTIN()` / `gstinSchema` (15-char format, state-code prefix).
- Cross-check line-item arithmetic against invoice totals within tolerance (`validateInvoiceArithmetic`) before confirming invoices.

## 4. Atomic database operations where necessary
- Operations that span multiple tables (invoice + line items, reconciliation match + transaction + invoice updates) should be treated as atomic units. Where Supabase client transactions are unavailable, sequence dependent writes carefully, roll back on failure, and log an audit event only on success.
- Invoice creation: persist the invoice, then line items, then audit event. If any step fails, surface the error and do not proceed.
- Reconciliation: verify shop membership of both transaction and invoice, insert the match, then update transaction and invoice payment status, then audit.

## 5. Secure document uploads and CSV imports
- Document uploads: validate MIME type against `ALLOWED_DOCUMENT_TYPES` (jpeg/png/webp/heic/heif/pdf) and size against `MAX_DOCUMENT_SIZE` (10MB) **before** storage. Validate content type, not just file extension. Reject path traversal in filenames.
- Store metadata in `documents` with `content_hash` for duplicate detection; set `processing_status` and `extraction_attempts`. Never auto-approve OCR-extracted invoices — they must remain `pending_review` for human review (enforced by `sync_invoice_fields` trigger).
- CSV imports: parse with `parseBankStatementCSV` (handles quoted fields, CRLF, DD/MM/YYYY and ISO dates, debit/credit and signed amount columns). Reject malformed files with clear errors. Track each import in `import_batches` (rows, imported, skipped, duplicates, errors) for audit and duplicate detection via `external_txn_id`.
- Validate all import payloads with Zod schemas in `src/lib/validation/schemas.ts` before persisting.

## 6. Reliable GST calculations and reporting
- GST engine (`src/lib/gst/calculator.ts`) is the single source of truth: `calculateTaxComponents` and `generateGSTPeriodSummary` (GSTR-1 outward supplies, GSTR-3B inward ITC, net tax payable).
- All GST outputs are deterministic and versioned (`calculation_version`, `ruleset_version` on `gst_summaries`). Do not hardcode tax rates or summary values outside the engine.
- GNANI must never claim to have filed a GST return to GSTN. It prepares summaries for human practitioner review/export only.
- Before filing/export, surface unresolved `review_issues` and warnings; require human confirmation.

## 7. Grounded GNANI AI responses using authorized business data
- GNANI EVON (`src/lib/ai/gnani.ts`) answers only about financial bookkeeping/GST guidance for the authorized shop. It declines non-financial requests.
- Ground responses in the shop's actual data (shop name, GSTIN, period, unreconciled count, open invoices). Never fabricate figures; use the GST engine for calculations.
- Responses must respect language (en/hi/bn/mr) and use respectful business terminology. Always cite sources/link to records where possible.
- Tool calls (if any) are strictly allowlisted, re-verify authentication and shop authorization, and financial changes require explicit user confirmation.

## 8. Meaningful testing and error handling
- Tests live in `src/lib/__tests__/*.test.ts` using node:test + assert. Run with `npm test` (`npx tsx --test src/lib/__tests__/*.test.ts`).
- Cover: RLS multi-tenant isolation, cross-shop prevention, unauthenticated rejection, GSTIN validation, decimal rounding, CGST/SGST/IGST splits, GSTR-1/GSTR-3B summaries, CSV parsing, invoice arithmetic, audit immutability, storage path convention.
- Every API route and server function must handle errors explicitly: check Supabase `error`, throw descriptive errors, return safe messages (no stack traces or internal IDs to the client), and log failures server-side.
- Fail closed: on auth/session or database errors, deny access rather than grant it (see middleware behavior).

## Development restrictions (standing rules)
- Do not modify existing application source files.
- Do not modify database migrations (`supabase/migrations/`).
- Do not delete or overwrite existing files.
- Do not expose environment variables, API keys, or credentials (`.env*` is gitignored; `.env.example` contains only names and safe placeholders).
- Inspect existing files before creating anything.
- Preserve all existing Git changes.
