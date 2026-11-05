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
 * Middleware wrapper for CSRF protection on state-changing API routes.
 * Expects the X-CSRF-Token header to match the session token.
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
  const sessionId = request.headers.get('x-session-id') || 'anonymous';
  const token = request.headers.get('x-csrf-token');

  if (!token) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'CSRF token required' }, { status: 403 }),
    };
  }

  if (!validateCsrfToken(sessionId, token)) {
    return {
      valid: false,
      response: NextResponse.json({ error: 'Invalid or expired CSRF token' }, { status: 403 }),
    };
  }

  return { valid: true };
}
