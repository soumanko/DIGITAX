/**
 * DIGITAX — Rate Limiter Utility
 *
 * Implements a sliding window rate limiter for API route protection.
 *
 * NOTE: This is an in-memory implementation suitable for single-instance
 * deployments and development. For production serverless deployments
 * (Vercel, AWS Lambda, etc.), in-memory state does not persist across
 * function invocations. Production deployments should use:
 * - Redis-based rate limiting (e.g., Upstash Redis)
 * - Edge-level rate limiting (Vercel Edge Config, Cloudflare)
 * - API Gateway rate limiting
 *
 * See docs/DEPLOYMENT_GUIDE.md for production configuration.
 */

interface RateLimitWindow {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * Creates a rate limiter with a sliding window.
 *
 * @param options - { windowMs: window size in ms, maxRequests: max requests per window }
 * @returns A function that returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const windows = new Map<string, RateLimitWindow>();

  return (identifier: string) => {
    const now = Date.now();
    const windowStart = now - (now % options.windowMs);
    const windowKey = `${identifier}:${windowStart}`;

    let window = windows.get(windowKey);

    if (!window || now > window.resetTime) {
      window = { count: 0, resetTime: windowStart + options.windowMs };
      windows.set(windowKey, window);
    }

    // Clean up old windows
    if (windows.size > 10000) {
      for (const [key, w] of windows.entries()) {
        if (now > w.resetTime) {
          windows.delete(key);
        }
      }
    }

    window.count++;
    const remaining = Math.max(0, options.maxRequests - window.count);

    return {
      allowed: window.count <= options.maxRequests,
      remaining,
      resetTime: window.resetTime,
    };
  };
}

/**
 * Pre-configured rate limiters for common use cases.
 */
export const rateLimiters = {
  /** Strict: 5 requests per minute (e.g., demo session, sensitive mutations) */
  strict: createRateLimiter({ windowMs: 60_000, maxRequests: 5 }),
  /** Moderate: 30 requests per minute (e.g., invoice creation, transaction import) */
  moderate: createRateLimiter({ windowMs: 60_000, maxRequests: 30 }),
  /** Relaxed: 100 requests per minute (e.g., reads, exports) */
  relaxed: createRateLimiter({ windowMs: 60_000, maxRequests: 100 }),
};

/**
 * Middleware wrapper for Next.js API routes.
 * Returns a 429 response if rate limit is exceeded.
 *
 * Usage:
 *   export async function POST(request) {
 *     const rateLimit = rateLimiters.moderate('shop:' + shopId);
 *     if (!rateLimit.allowed) {
 *       return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *     }
 *     // ... handler logic
 *   }
 */
export function rateLimitResponse(rateLimit: ReturnType<ReturnType<typeof createRateLimiter>>) {
  if (!rateLimit.allowed) {
    return {
      blocked: true,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        },
      ),
    };
  }
  return { blocked: false, response: null };
}
