import type { FastifyRequest } from 'fastify';

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
  limit: number;
  remaining: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export function createIpRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  return {
    check(request: FastifyRequest): RateLimitResult {
      const now = Date.now();
      const ip = request.ip ?? 'unknown';
      const key = `${options.keyPrefix}:${ip}`;
      const entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        const resetAt = now + options.windowMs;
        store.set(key, { count: 1, resetAt });
        return {
          allowed: true,
          retryAfterMs: options.windowMs,
          limit: options.maxRequests,
          remaining: Math.max(0, options.maxRequests - 1),
          resetAt
        };
      }

      if (entry.count >= options.maxRequests) {
        return {
          allowed: false,
          retryAfterMs: entry.resetAt - now,
          limit: options.maxRequests,
          remaining: 0,
          resetAt: entry.resetAt
        };
      }

      entry.count += 1;
      return {
        allowed: true,
        retryAfterMs: entry.resetAt - now,
        limit: options.maxRequests,
        remaining: Math.max(0, options.maxRequests - entry.count),
        resetAt: entry.resetAt
      };
    }
  };
}
