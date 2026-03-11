/**
 * In-memory sliding window rate limiter for Vercel serverless.
 * Note: Resets on cold starts, which is acceptable for basic protection.
 * For production-grade rate limiting, consider Vercel KV or Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpired(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/** Preset rate limit configurations */
export const RATE_LIMITS = {
  AUTH_REGISTER: { maxRequests: 3, windowSeconds: 15 * 60 } as RateLimitConfig,
  AUTH_LOGIN: { maxRequests: 5, windowSeconds: 15 * 60 } as RateLimitConfig,
  GENERAL_API: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,
  AI_ANALYSIS: { maxRequests: 10, windowSeconds: 60 * 60 } as RateLimitConfig,
};

/**
 * Check rate limit for a given identifier (e.g., IP address or user ID).
 * @param identifier - Unique key for the rate limit (e.g., "login:192.168.1.1")
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if the request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = rateLimitMap.get(identifier);

  // No existing entry or window expired — allow and start new window
  if (!entry || now >= entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: resetTime,
      retryAfterSeconds: 0,
    };
  }

  // Within window — check count
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      success: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetTime,
      retryAfterSeconds: 0,
    };
  }

  // Rate limited
  const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
  return {
    success: false,
    remaining: 0,
    resetAt: entry.resetTime,
    retryAfterSeconds,
  };
}

/**
 * Extract client IP from request headers (works behind Vercel/Cloudflare proxy).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * Create a 429 Too Many Requests JSON response.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}

/** Exported for testing purposes */
export function _resetRateLimitMap(): void {
  rateLimitMap.clear();
}
