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

function parseCorsAllowedOrigins(value: string | undefined): string[] {
  const fallback = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  if (!value) {
    return fallback;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return origins.length > 0 ? origins : fallback;
}

export type RateLimitConfig = {
  windowMs: number;
  createMaxRequests: number;
  paymentMaxRequests: number;
  proposalMaxRequests: number;
};

export type CorsConfig = {
  allowedOrigins: string[];
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

export function getCorsConfig(): CorsConfig {
  return {
    allowedOrigins: parseCorsAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS)
  };
}
