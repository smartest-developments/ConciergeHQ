import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server.js';
import { getCorsConfig } from '../src/lib/runtimeConfig.js';

const prismaStub = {
  sourcingRequest: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn()
  },
  user: {
    upsert: vi.fn()
  },
  requestStatusEvent: {
    create: vi.fn()
  },
  $transaction: vi.fn()
} as any;

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('CORS config', () => {
  it('allows all origins in non-production when no allow-list is configured', () => {
    process.env = { ...originalEnv };
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.WEB_BASE_URL;
    process.env.NODE_ENV = 'development';

    expect(getCorsConfig()).toEqual({
      allowAllOrigins: true,
      allowedOrigins: []
    });
  });

  it('restricts origins in production to configured allow-list', () => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com, https://admin.example.com';
    process.env.WEB_BASE_URL = 'https://web.example.com';

    expect(getCorsConfig()).toEqual({
      allowAllOrigins: false,
      allowedOrigins: ['https://app.example.com', 'https://admin.example.com', 'https://web.example.com']
    });
  });
});

describe('CORS behavior', () => {
  it('echoes requesting origin when non-production fallback allows all', async () => {
    process.env = { ...originalEnv };
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.WEB_BASE_URL;
    process.env.NODE_ENV = 'test';
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/health',
      headers: {
        origin: 'https://untrusted.example.com',
        'access-control-request-method': 'GET'
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('https://untrusted.example.com');

    await app.close();
  });

  it('omits allow-origin header for origins not on the production allow-list', async () => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';
    delete process.env.WEB_BASE_URL;
    const app = createServer(prismaStub);

    const deniedResponse = await app.inject({
      method: 'OPTIONS',
      url: '/api/health',
      headers: {
        origin: 'https://blocked.example.com',
        'access-control-request-method': 'GET'
      }
    });

    expect(deniedResponse.statusCode).toBe(404);
    expect(deniedResponse.headers['access-control-allow-origin']).toBeUndefined();

    const allowedResponse = await app.inject({
      method: 'OPTIONS',
      url: '/api/health',
      headers: {
        origin: 'https://app.example.com',
        'access-control-request-method': 'GET'
      }
    });

    expect(allowedResponse.statusCode).toBe(204);
    expect(allowedResponse.headers['access-control-allow-origin']).toBe('https://app.example.com');

    await app.close();
  });
});
