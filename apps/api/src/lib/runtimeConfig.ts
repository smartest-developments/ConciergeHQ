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

function assertPositiveIntEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    return;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function assertUrlEnv(name: string, value: string | undefined): void {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  try {
    new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

function assertCorsOrigins(value: string | undefined): void {
  if (!value) {
    return;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS must include at least one origin');
  }

  for (const origin of origins) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`CORS_ALLOWED_ORIGINS contains invalid URL: ${origin}`);
    }
  }
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

export function validateStartupEnv(env: NodeJS.ProcessEnv = process.env): void {
  const validationErrors: string[] = [];

  if (!env.STRIPE_SECRET_KEY?.trim()) {
    validationErrors.push('STRIPE_SECRET_KEY is required');
  }

  try {
    assertUrlEnv('WEB_BASE_URL', env.WEB_BASE_URL);
  } catch (error) {
    validationErrors.push(error instanceof Error ? error.message : 'WEB_BASE_URL is invalid');
  }

  try {
    assertCorsOrigins(env.CORS_ALLOWED_ORIGINS);
  } catch (error) {
    validationErrors.push(
      error instanceof Error ? error.message : 'CORS_ALLOWED_ORIGINS is invalid'
    );
  }

  for (const key of [
    'RATE_LIMIT_WINDOW_MINUTES',
    'RATE_LIMIT_CREATE_MAX_REQUESTS',
    'RATE_LIMIT_PAYMENT_MAX_REQUESTS',
    'RATE_LIMIT_PROPOSAL_MAX_REQUESTS'
  ] as const) {
    try {
      assertPositiveIntEnv(key, env[key]);
    } catch (error) {
      validationErrors.push(error instanceof Error ? error.message : `${key} is invalid`);
    }
  }

  if (validationErrors.length > 0) {
    throw new Error(`Invalid startup environment: ${validationErrors.join('; ')}`);
  }
}

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
