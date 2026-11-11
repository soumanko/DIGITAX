/**
 * CSRF Protection for DIGITAX
 *
 * Implements a synchronizer token pattern for state-changing API endpoints.
 * The CSRF token is stored server-side (in memory) and validated on each
 * state-changing request. The token is passed via the X-CSRF-Token header.
 *
 * NOTE: This is an in-memory implementation suitable for development and
 * single-instance deployments. Production serverless deployments should use
 * Redis or edge-level CSRF protection.
 */
import { NextResponse } from 'next/server';

interface CsrfToken {
  token: string;
  expiresAt: number;
}

const csrfTokens = new Map<string, CsrfToken>();
const CSRF_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * @deprecated The synchronizer-token flow was never wired into any route or
 * client and is superseded by Origin verification in csrfMiddleware().
 * Retained only for backwards compatibility with existing imports.
 * Generate a new CSRF token for a given session/user.
 */
export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomUUID();
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + CSRF_TTL_MS,
  });
  return token;
}

/**
 * Validate a CSRF token for a given session/user.
 * Returns true if the token is valid and not expired.
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

/**
 * Clean up expired CSRF tokens.
 */
export function cleanupCsrfTokens(): void {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expiresAt) {
      csrfTokens.delete(key);
    }
  }
}

// Clean up expired tokens every 5 minutes
setInterval(cleanupCsrfTokens, 5 * 60 * 1000);

/**
 * Hosts a same-origin POST is allowed to target. The request's own Host
 * (and any forwarding proxy host) is always trusted; NEXT_PUBLIC_APP_URL
 * is added when configured so requests behind a reverse proxy still validate.
 */
function getAllowedHosts(request: Request): string[] {
  const hosts: string[] = [];
  const host = request.headers.get('host');
  if (host) hosts.push(host.toLowerCase().trim());
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    forwardedHost.split(',').forEach((h) => {
      const trimmed = h.trim().toLowerCase();
      if (trimmed) hosts.push(trimmed);
    });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      hosts.push(new URL(appUrl).host.toLowerCase());
    } catch {
      // Invalid NEXT_PUBLIC_APP_URL — ignore rather than crash request handling.
    }
  }
  return hosts;
}

/**
 * Middleware wrapper for CSRF protection on state-changing API routes.
 *
 * Implementation: strict Origin verification (OWASP-recommended primary CSRF
 * defence for cookie-authenticated SPAs). Browsers always attach an `Origin`
 * header to non-GET requests, and a cross-site attacker cannot forge a
 * matching Origin for the victim's host. Supabase Auth cookies are SameSite
 * Lax by default, which blocks most cross-site sends secondarily.
 *
 * The previous synchronizer-token implementation below (generateCsrfToken /
 * validateCsrfToken) was never wired to any route or client: no token could be
 * issued, so every state-changing request was rejected with 403 — the entire
 * write path (shop creation, invoices, documents, reconciliation, sign-out)
 * was unusable. The token functions are retained for compatibility but unused.
 *
 * Usage:
 *   export async function POST(request) {
 *     const csrfResult = csrfMiddleware(request);
 *     if (!csrfResult.valid) {
 *       return csrfResult.response;
 *     }
 *     // ... handler logic
 *   }
 */
export function csrfMiddleware(request: Request): { valid: boolean; response?: Response } {
  const allowedHosts = getAllowedHosts(request);

  // Browsers send Origin on all state-changing requests (fetch, XHR, form POST).
  // Fall back to Referer for older clients. Fail closed when neither is present.
  const originHeader = request.headers.get('origin') || request.headers.get('referer');

  if (!originHeader) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'CSRF validation failed: origin header required' }, { status: 403 }),
    };
  }

  let originHost: string;
  try {
    originHost = new URL(originHeader).host.toLowerCase();
  } catch {
    return {
      valid: false,
      response: NextResponse.json({ error: 'CSRF validation failed: malformed origin header' }, { status: 403 }),
    };
  }

  if (!allowedHosts.includes(originHost)) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'CSRF validation failed: cross-origin request rejected' }, { status: 403 }),
    };
  }

  return { valid: true };
}
