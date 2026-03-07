import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestStatus } from '@prisma/client';
import { createServer } from '../src/server.js';
import { AUTH_SESSION_COOKIE_NAME } from '../src/lib/sessionAuth.js';

const makePrismaMock = () =>
  ({
    sourcingRequest: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn()
    },
    user: {
      upsert: vi.fn()
    },
    session: {
      findUnique: vi.fn()
    },
    requestStatusEvent: {
      create: vi.fn()
    },
    proposal: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }) as const;

describe('POST /api/requests/:id/proposals auth unhappy paths', () => {
  const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const originalWebBaseUrl = process.env.WEB_BASE_URL;
  const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey ?? 'sk_test_123';
    process.env.WEB_BASE_URL = originalWebBaseUrl ?? 'http://localhost:5173';
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins ?? 'http://localhost:5173';
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    process.env.WEB_BASE_URL = originalWebBaseUrl;
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins;
  });

  it('returns 401 AUTH_REQUIRED when session cookie is missing', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/55/proposals',
      payload: {
        merchantName: 'Prime Mobility',
        externalUrl: 'https://merchant.example/p/55'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'AUTH_REQUIRED' });
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
    expect(prisma.sourcingRequest.findUnique).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns 403 OPERATOR_FORBIDDEN for authenticated customer session', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 501,
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 77,
        email: 'customer@example.com',
        role: 'CUSTOMER'
      }
    });
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 55,
      status: RequestStatus.FEE_PAID
    });

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/55/proposals',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=token-customer`
      },
      payload: {
        merchantName: 'Prime Mobility',
        externalUrl: 'https://merchant.example/p/55'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'OPERATOR_FORBIDDEN' });
    expect(prisma.sourcingRequest.findUnique).not.toHaveBeenCalled();
    expect(prisma.proposal.create).not.toHaveBeenCalled();
    expect(prisma.requestStatusEvent.create).not.toHaveBeenCalled();

    await app.close();
  });
});
