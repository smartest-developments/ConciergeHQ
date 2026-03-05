import { afterEach, describe, expect, it } from 'vitest';
import { getCorsConfig } from '../src/lib/runtimeConfig.js';

const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

afterEach(() => {
  process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins;
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
});
