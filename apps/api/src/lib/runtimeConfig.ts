import { z } from 'zod';

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

export type ServerConfig = {
  host: string;
  port: number;
};

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

const startupConfigSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.optional(),
    PORT: z.coerce.number().int().min(1).max(65535).optional(),
    DATABASE_URL: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    WEB_BASE_URL: z
      .string()
      .url()
      .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === 'http:' || protocol === 'https:';
      }, 'WEB_BASE_URL must use http or https'),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_CREATE_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_PAYMENT_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_PROPOSAL_MAX_REQUESTS: z.coerce.number().int().positive().optional()
  })
  .superRefine((config, ctx) => {
    const configuredOrigins = parseOriginList(config.CORS_ALLOWED_ORIGINS);
    const rawOriginCount = config.CORS_ALLOWED_ORIGINS
      ? config.CORS_ALLOWED_ORIGINS.split(',').filter((entry) => entry.trim().length > 0).length
      : 0;

    if (configuredOrigins.length !== rawOriginCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ALLOWED_ORIGINS'],
        message: 'CORS_ALLOWED_ORIGINS must contain only absolute origins'
      });
    }
  });

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

export function validateStartupConfig(env: NodeJS.ProcessEnv = process.env): void {
  const parsed = startupConfigSchema.safeParse(env);

  if (parsed.success) {
    return;
  }

  const issueList = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'env';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

  throw new Error(`Invalid runtime configuration: ${issueList}`);
}

export function getServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsedPort = parsePositiveInt(env.PORT, 3001);

  return {
    host: '0.0.0.0',
    port: parsedPort
  };
}
