import { afterEach, describe, expect, it } from 'vitest';
import { getCorsConfig, validateStartupEnv } from '../src/lib/runtimeConfig.js';

const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalWebBaseUrl = process.env.WEB_BASE_URL;
const originalRateLimitWindowMinutes = process.env.RATE_LIMIT_WINDOW_MINUTES;

afterEach(() => {
  process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins;
  process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
  process.env.WEB_BASE_URL = originalWebBaseUrl;
  process.env.RATE_LIMIT_WINDOW_MINUTES = originalRateLimitWindowMinutes;
});

describe('runtime CORS config', () => {
  it('uses localhost defaults when env var is missing', () => {
    delete process.env.CORS_ALLOWED_ORIGINS;

    const config = getCorsConfig();

    expect(config.allowedOrigins).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173']);
  });

  it('parses comma-separated origins and trims whitespace', () => {
    process.env.CORS_ALLOWED_ORIGINS = ' https://app.example.com,https://admin.example.com ';

    const config = getCorsConfig();

    expect(config.allowedOrigins).toEqual([
      'https://app.example.com',
      'https://admin.example.com'
    ]);
  });

  it('throws when required startup env vars are missing', () => {
    const env = {
      CORS_ALLOWED_ORIGINS: 'https://app.example.com'
    } as NodeJS.ProcessEnv;

    expect(() => validateStartupEnv(env)).toThrow(/STRIPE_SECRET_KEY is required/);
    expect(() => validateStartupEnv(env)).toThrow(/WEB_BASE_URL is required/);
  });

  it('throws when typed startup env vars are invalid', () => {
    const env = {
      STRIPE_SECRET_KEY: 'sk_test_123',
      WEB_BASE_URL: 'not-a-url',
      RATE_LIMIT_WINDOW_MINUTES: '0'
    } as NodeJS.ProcessEnv;

    expect(() => validateStartupEnv(env)).toThrow(/WEB_BASE_URL must be a valid URL/);
    expect(() => validateStartupEnv(env)).toThrow(/RATE_LIMIT_WINDOW_MINUTES must be a positive integer/);
  });

  it('accepts valid startup env vars', () => {
    const env = {
      STRIPE_SECRET_KEY: 'sk_test_123',
      WEB_BASE_URL: 'https://app.example.com',
      CORS_ALLOWED_ORIGINS: 'https://app.example.com,https://admin.example.com',
      RATE_LIMIT_WINDOW_MINUTES: '5'
    } as NodeJS.ProcessEnv;

    expect(() => validateStartupEnv(env)).not.toThrow();
  });
});
