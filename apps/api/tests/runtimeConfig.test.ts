import { describe, expect, it } from 'vitest';
import { getServerConfig, validateStartupConfig } from '../src/lib/runtimeConfig.js';

const validEnv = {
  DATABASE_URL: 'postgresql://concierge:concierge@localhost:55432/conciergehq?schema=public',
  STRIPE_SECRET_KEY: 'sk_test_123',
  WEB_BASE_URL: 'http://localhost:5173',
  PORT: '3001',
  NODE_ENV: 'development'
};

describe('validateStartupConfig', () => {
  it('accepts a valid env map', () => {
    expect(() => validateStartupConfig(validEnv)).not.toThrow();
  });

  it('rejects missing required values', () => {
    const env = {
      ...validEnv,
      STRIPE_SECRET_KEY: ''
    };

    expect(() => validateStartupConfig(env)).toThrow(/STRIPE_SECRET_KEY/);
  });

  it('rejects invalid numeric values', () => {
    const env = {
      ...validEnv,
      RATE_LIMIT_WINDOW_MINUTES: 'abc'
    };

    expect(() => validateStartupConfig(env)).toThrow(/RATE_LIMIT_WINDOW_MINUTES/);
  });

  it('rejects invalid CORS origin entries', () => {
    const env = {
      ...validEnv,
      CORS_ALLOWED_ORIGINS: 'https://app.example.com,not-a-url'
    };

    expect(() => validateStartupConfig(env)).toThrow(/CORS_ALLOWED_ORIGINS/);
  });
});

describe('getServerConfig', () => {
  it('uses default port when none is provided', () => {
    expect(getServerConfig({})).toEqual({
      host: '0.0.0.0',
      port: 3001
    });
  });

  it('parses configured port', () => {
    expect(getServerConfig({ PORT: '4123' })).toEqual({
      host: '0.0.0.0',
      port: 4123
    });
  });
});
