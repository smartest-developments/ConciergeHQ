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

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseOriginList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const uniqueOrigins = new Set<string>();
  for (const rawEntry of value.split(',')) {
    const trimmedEntry = rawEntry.trim();
    if (!trimmedEntry) {
      continue;
    }

    const normalized = normalizeOrigin(trimmedEntry);
    if (normalized) {
      uniqueOrigins.add(normalized);
    }
  }

  return Array.from(uniqueOrigins);
}

export type RateLimitConfig = {
  windowMs: number;
  createMaxRequests: number;
  paymentMaxRequests: number;
  proposalMaxRequests: number;
};

export type CorsConfig = {
  allowAllOrigins: boolean;
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
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  const isProduction = nodeEnv === 'production';

  const configuredOrigins = parseOriginList(process.env.CORS_ALLOWED_ORIGINS);
  const webBaseOrigin = process.env.WEB_BASE_URL
    ? normalizeOrigin(process.env.WEB_BASE_URL.trim())
    : null;

  const allowedOrigins = new Set(configuredOrigins);
  if (webBaseOrigin) {
    allowedOrigins.add(webBaseOrigin);
  }

  if (!isProduction && allowedOrigins.size === 0) {
    return {
      allowAllOrigins: true,
      allowedOrigins: []
    };
  }

  return {
    allowAllOrigins: false,
    allowedOrigins: Array.from(allowedOrigins)
  };
}
