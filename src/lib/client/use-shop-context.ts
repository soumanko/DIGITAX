'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * The single client-side business context hook.
 *
 * The server (`getAuthenticatedContext`) is the SOURCE OF TRUTH: it resolves
 * the authenticated user's authorized shop (owner or verified membership) and
 * never trusts client-supplied shop identifiers. This hook merely surfaces
 * that authoritative state to client pages — it performs no authorization
 * decisions of its own and has no demo fallbacks. When the user switches
 * business (POST /api/shops/switch sets the httpOnly cookie) a `refresh()`
 * re-reads the server-resolved context.
 */

export interface ShopContext {
  id: string;
  name: string;
  gstin: string | null;
  business_type?: string | null;
  state_code?: string | null;
  state?: string | null;
  taxpayer_scheme?: string | null;
  preferred_language?: string | null;
}

interface UseShopContextResult {
  /** Server-resolved authorized active shop (or null when none/onboarding pending). */
  shop: ShopContext | null;
  loading: boolean;
  /** 'no-shop' — authenticated but no business yet (complete onboarding). */
  needsOnboarding: boolean;
  /** 'error' — network/server failure (retry available via refresh). */
  error: boolean;
  /** Real signed-in user email from `supabase.auth.getUser()` (or null). */
  userEmail: string | null;
  /** Auth UID of the signed-in user — used to attribute audit activity rows. */
  userId: string | null;
  refresh: () => void;
}

export function useShopContext(): UseShopContextResult {
  const [shop, setShop] = useState<ShopContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Real identity for user chips — no local fake names anywhere.
  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) {
          setUserEmail(data?.user?.email ?? null);
          setUserId(data?.user?.id ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserEmail(null);
          setUserId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch('/api/shops', { cache: 'no-store' });
        if (cancelled) return;
        if (res.status === 401) {
          // Session expired — middleware will redirect on navigation; surface error state.
          setError(true);
          setShop(null);
          return;
        }
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && data?.shop) {
          setShop(data.shop);
        } else {
          setShop(null);
        }
      } catch {
        if (!cancelled) setError(true);
        setShop(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { shop, loading, error, needsOnboarding: !loading && !error && !shop, userEmail, userId, refresh };
}

/** Standard initials helper shared by context-aware page headers. */
export function shopInitials(name: string | null | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Initials for the signed-in identity: email local-part, capped at 2 chars. */
export function identityInitials(email: string | null | undefined): string {
  if (!email) return 'A';
  const local = email.split('@')[0];
  const words = local.split(/[._\-+]/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
