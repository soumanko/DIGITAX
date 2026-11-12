# Business Context Architecture

**Project:** DIGITAX  
**Date:** Tue Nov 10 2026  
**Status:** Implemented  
**Classification:** Architecture / Security

---

## 1. Purpose

Establish a single, authoritative, server-resolved business context so that every page, API route, server action, database query, and storage operation resolves the currently authenticated user's authorized business. A user must never see another user's or another business's data.

The design keeps the server as the source of truth. The client is a thin reflection of server-resolved context and performs no authorization decisions of its own.

---

## 2. Identity → Business Resolution Chain

```
Supabase Auth user (signed-in session)
        │
        ▼
supabase.auth.getUser()  →  userId + userEmail  (client, via useShopContext)
        │
        ▼  server-side, per request
GET /api/shops  →  getAuthenticatedContext()
        │
        ├─ auth.getUser() → authenticated user (or 401)
        ├─ resolve dx_active_shop cookie (stale → fallback)
        │     └─ fallback: user's own newest authorized shop (RLS-scoped)
        └─ validate shop membership (owner or shop_members)
        │
        ▼
Authorized shop context (shop_id, name, gstin, …)
        │
        ▼  every API route independently re-resolves
Supabase query scoped to shop_id  (RLS enforces at DB layer)
        │
        ▼
Page renders only this business's records
```

---

## 3. Authoritative Client Hook: `useShopContext()`

**File:** `src/lib/client/use-shop-context.ts`

The single client-side business context hook. It:
- Calls `GET /api/shops` (server-resolved shop) on mount and on `refresh()`.
- Calls `supabase.auth.getUser()` to surface the real signed-in user email and UID.
- Never trusts client-supplied `shop_id`; has no demo fallbacks; never silently substitutes another user's business.
- Exposes `shop`, `loading`, `needsOnboarding`, `error`, `userEmail`, `userId`, `refresh()`.
- Provides helpers `shopInitials(name)` and `identityInitials(email)` for avatar chips.

When the user switches business (`POST /api/shops/switch` sets the `dx_active_shop` httpOnly cookie), calling `refresh()` re-reads the server-resolved context.

### Exported surface

| Export | Purpose |
|--------|---------|
| `useShopContext()` | Returns `{ shop, loading, needsOnboarding, error, userEmail, userId, refresh }` |
| `shopInitials(name)` | 2-char initials from a business name |
| `identityInitials(email)` | 2-char initials from the signed-in email local-part |

---

## 4. Server-Side Context Resolution: `getAuthenticatedContext()`

**File:** `src/lib/supabase/server-db.ts`

```ts
export interface AuthContext {
  userId: string;
  isDemo: boolean;
  shop: DbShop | null;
  userRole: string;
}
```

Behavior:
1. `supabase.auth.getUser()` — returns `{ userId: '', shop: null }` when unauthenticated (fail closed).
2. Reads the `dx_active_shop` cookie. If present, attempts to resolve that shop.
3. If the cookie shop is missing, not found, or not authorized, falls back to the user's own newest authorized shop (`shops` ordered by `created_at DESC`, limit 1).
4. Validates membership: the user must be the shop owner or a member of `shop_members`.
5. Returns the authorized shop (or `null` → `needsOnboarding`).

RLS guarantees the fallback query never returns foreign data. The cookie is never blindly trusted.

---

## 5. API Authorization Pattern

Every business-specific API route independently resolves the authorized business server-side:

```ts
const ctx = await getAuthenticatedContext();
if (!ctx.userId) return 401;
if (!ctx.shop) return 404; // no active business
// All subsequent queries scoped to ctx.shop.id
```

**Rules:**
- Never trust a browser-supplied `shop_id` as proof of authorization.
- `createClient()` (anon key, cookie-based session) for user-scoped operations.
- `createServiceClient()` (service role key) server-side only, never exposed to the browser, used only for elevated operations (e.g. ephemeral test-user creation in tests).
- Return 401/403/404 appropriately; never leak information about other businesses on denial.

**Business-scoped API routes:**
- `GET /api/shops` — resolves the active authorized shop (or `needsOnboarding: true`).
- `GET /api/shops/list` — lists the user's authorized shops (no phantom `is_active`).
- `POST /api/shops/switch` — switches the active business (sets `dx_active_shop` cookie).
- `GET /api/transactions`, `GET /api/invoices` — RLS-scoped to `ctx.shop.id`.
- `GET /api/gst/summary` — GST engine figures for the authorized shop/period.
- `GET /api/audit-events` — RLS-scoped audit feed for the active shop.
- `GET /api/reconciliation` — same-shop match suggestions (trigger-enforced).
- `GET /api/exports` — GSTR-1/GSTR-3B exports scoped to the authorized shop.

---

## 6. Multi-Tenant Isolation Enforcement

- Every tenant table carries `shop_id`; all queries are scoped by `shop_id`.
- Cross-shop reconciliation matches are rejected by the `enforce_reconciliation_same_shop` trigger.
- RLS policies use `is_shop_member(shop_id)` / `is_shop_admin(shop_id)` / `owner_id = auth.uid()`.
- Storage: documents go to the private `shop-documents` bucket under `{shop_id}/{document_id}/{filename}`; access is RLS-controlled by shop; signed URLs for authorized access only.

---

## 7. Session & Context Lifecycle

| Event | Context behavior |
|-------|-----------------|
| Sign in | `useShopContext()` fetches `/api/shops`; shop resolved server-side |
| Navigate between modules | Every page re-fetches via `useShopContext()`; context stays consistent |
| Switch business | `POST /api/shops/switch` sets cookie; page calls `refresh()` to re-read |
| Sign out | Middleware clears session; redirect to `/login`; no stale context |
| No business yet | `needsOnboarding: true`; pages show onboarding state, no demo fallback |
| Stale cookie | Falls back to user's own newest authorized shop |

---

## 8. What Was NOT Changed (by design)

- No frontend redesign — layouts, typography, colors, tokens, animations, and navigation are preserved exactly.
- No database migrations or RLS policy changes.
- No users or businesses created, modified, or deleted (except ephemeral test identities in the cross-tenant test, which are torn down).
- No seed scripts run.
- No `localStorage`/`sessionStorage` business-context singletons introduced.

---

## 9. Files

| File | Role |
|------|------|
| `src/lib/client/use-shop-context.ts` | Authoritative client context hook |
| `src/lib/supabase/server-db.ts` | `getAuthenticatedContext()`, `logAuditEventServer()` |
| `src/app/api/shops/route.ts` | Active shop resolution |
| `src/app/api/shops/list/route.ts` | Authorized shop list |
| `src/app/api/shops/switch/route.ts` | Business switching |
| `src/components/layout/static-business-name.tsx` | RLS-resolved sidebar business chip |
