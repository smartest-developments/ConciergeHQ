import type { FastifyRequest } from 'fastify';

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
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
        store.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true, retryAfterMs: options.windowMs };
      }

      if (entry.count >= options.maxRequests) {
        return { allowed: false, retryAfterMs: entry.resetAt - now };
      }

      entry.count += 1;
      return { allowed: true, retryAfterMs: entry.resetAt - now };
    }
  };
}
