function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export type RateLimitConfig = {
  windowMs: number;
  createMaxRequests: number;
  paymentMaxRequests: number;
  proposalMaxRequests: number;
};

export function getRateLimitConfig(): RateLimitConfig {
  const windowMinutes = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10);

  return {
    windowMs: windowMinutes * 60 * 1000,
    createMaxRequests: parsePositiveInt(process.env.RATE_LIMIT_CREATE_MAX_REQUESTS, 10),
    paymentMaxRequests: parsePositiveInt(process.env.RATE_LIMIT_PAYMENT_MAX_REQUESTS, 20),
    proposalMaxRequests: parsePositiveInt(process.env.RATE_LIMIT_PROPOSAL_MAX_REQUESTS, 20)
  };
}
