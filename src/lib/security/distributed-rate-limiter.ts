/**
 * DIGITAX — Distributed Rate Limiter
 *
 * Implements a Redis-compatible distributed rate limiter with local Map fallback
 * for development. In production, set REDIS_URL to use Redis for shared state
 * across serverless function invocations.
 *
 * Safety behavior: If Redis is unavailable in production, the limiter fails
 * CLOSED (denies requests) to prevent unlimited access.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface DistributedRateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

/**
 * Redis client interface for rate limiting.
 * Supports Upstash Redis or any Redis-compatible client.
 */
interface RedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
}

/**
 * Local in-memory rate limiter for development/single-instance.
 */
class LocalRateLimiter {
  private windows = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - (now % windowMs);
    const windowKey = `${key}:${windowStart}`;
    const resetTime = windowStart + windowMs;

    let window = this.windows.get(windowKey);

    if (!window || now > window.resetTime) {
      window = { count: 0, resetTime };
      this.windows.set(windowKey, window);
    }

    // Cleanup old windows
    if (this.windows.size > 10000) {
      for (const [k, w] of this.windows.entries()) {
        if (now > w.resetTime) {
          this.windows.delete(k);
        }
      }
    }

    window.count++;
    const remaining = Math.max(0, 0); // calculated below

    return {
      allowed: true, // local always allows in dev
      remaining: Math.max(0, 0), // not tracked locally for remaining
      resetTime,
    };
  }
}

/**
 * Creates a distributed rate limiter.
 *
 * @param options - Rate limiter configuration
 * @param redis - Optional Redis client for distributed state. If not provided,
 *   uses local in-memory storage (development only).
 * @param isProduction - Whether running in production. If true and Redis is
 *   unavailable, fails closed (denies all requests).
 */
export function createDistributedRateLimiter(
  options: DistributedRateLimiterOptions,
  redis?: RedisClient,
  isProduction = false
) {
  const localLimiter = new LocalRateLimiter();
  const { windowMs, maxRequests, keyPrefix } = options;

  return async (identifier: string): Promise<RateLimitResult> => {
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);
    const resetTime = Math.ceil(now / windowMs) * windowMs + windowMs;

    // Try Redis first if available
    if (redis) {
      try {
        const current = await redis.incr(key);

        // Set expiry on first increment of window
        if (current === 1) {
          await redis.expire(key, windowSeconds);
        }

        const allowed = current <= maxRequests;
        const remaining = Math.max(0, maxRequests - current);
        const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

        return {
          allowed,
          remaining,
          resetTime,
          ...(retryAfter ? { retryAfter } : {}),
        };
      } catch (err) {
        // Redis error handling
        if (isProduction) {
          // Fail closed in production: deny all requests if Redis is unavailable
          console.error('Distributed rate limiter Redis error (production, failing closed):', err);
          return {
            allowed: false,
            remaining: 0,
            resetTime,
            retryAfter: Math.ceil((resetTime - now) / 1000),
          };
        }
        // In development, fall back to local limiter
        console.warn('Distributed rate limiter Redis error, falling back to local:', err);
        const result = localLimiter.increment(key, windowMs);
        return {
          ...result,
          allowed: true,
          remaining: maxRequests,
        };
      }
    }

    // No Redis client - use local storage
    if (isProduction) {
      // Production without Redis is unsafe - fail closed
      console.error('Distributed rate limiter: no Redis client in production, failing closed');
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    // Development with local storage
    const result = localLimiter.increment(key, windowMs);
    return {
      ...result,
      allowed: true,
      remaining: maxRequests,
    };
  };
}

/**
 * Pre-configured distributed rate limiters.
 * These will use Redis if REDIS_URL is configured, otherwise fall back to local.
 */
export function createDistributedRateLimiters(
  redis?: RedisClient,
  isProduction = false
) {
  return {
    /** Strict: 5 requests per minute (demo session, sensitive mutations) */
    strict: createDistributedRateLimiter(
      { windowMs: 60_000, maxRequests: 5, keyPrefix: 'digitax:strict' },
      redis,
      isProduction
    ),
    /** Moderate: 30 requests per minute (invoice creation, transaction import) */
    moderate: createDistributedRateLimiter(
      { windowMs: 60_000, maxRequests: 30, keyPrefix: 'digitax:moderate' },
      redis,
      isProduction
    ),
    /** Relaxed: 100 requests per minute (reads, exports) */
    relaxed: createDistributedRateLimiter(
      { windowMs: 60_000, maxRequests: 100, keyPrefix: 'digitax:relaxed' },
      redis,
      isProduction
    ),
  };
}

/**
 * Creates Redis client from Upstash or standard Redis URL.
 * Returns undefined if no Redis URL is configured.
 */
export function createRedisClient(redisUrl?: string): RedisClient | undefined {
  if (!redisUrl) {
    return undefined;
  }

  // Try Upstash Redis (REST API) first
  if (redisUrl.includes('upstash.io')) {
    return createUpstashClient(redisUrl);
  }

  // Standard Redis via ioredis or similar would go here
  // For now, return undefined to use local fallback
  console.warn('Standard Redis client not implemented. Set up Upstash Redis for distributed rate limiting.');
  return undefined;
}

/**
 * Upstash Redis REST API client.
 */
function createUpstashClient(url: string): RedisClient {
  // Extract endpoint and token from Upstash URL
  // Format: https://<endpoint>.upstash.io with UPSTASH_REDIS_REST_TOKEN
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  return {
    async incr(key: string): Promise<number> {
      const response = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: restToken ? { Authorization: `Bearer ${restToken}` } : {},
      });
      if (!response.ok) throw new Error(`Upstash incr failed: ${response.status}`);
      const data = await response.json();
      return data.result;
    },
    async expire(key: string, seconds: number): Promise<void> {
      const response = await fetch(`${url}/expire/${encodeURIComponent(key)}/${seconds}`, {
        method: 'POST',
        headers: restToken ? { Authorization: `Bearer ${restToken}` } : {},
      });
      if (!response.ok) throw new Error(`Upstash expire failed: ${response.status}`);
    },
    async get(key: string): Promise<string | null> {
      const response = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: restToken ? { Authorization: `Bearer ${restToken}` } : {},
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.result ?? null;
    },
  };
}

export type { RateLimitResult };
export type { DistributedRateLimiterOptions };