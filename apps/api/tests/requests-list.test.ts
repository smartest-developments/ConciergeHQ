import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestStatus } from '@prisma/client';
import { createServer } from '../src/server.js';

const makePrismaMock = () =>
  ({
    sourcingRequest: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    user: {
      upsert: vi.fn()
    },
    requestStatusEvent: {
      create: vi.fn()
    },
    proposal: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }) as const;

describe('GET /api/requests list filters', () => {
  const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const originalWebBaseUrl = process.env.WEB_BASE_URL;
  const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey ?? 'sk_test_123';
    process.env.WEB_BASE_URL = originalWebBaseUrl ?? 'http://localhost:5173';
    process.env.CORS_ALLOWED_ORIGINS =
      originalCorsAllowedOrigins ?? 'http://localhost:5173';
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    process.env.WEB_BASE_URL = originalWebBaseUrl;
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins;
  });

  it('applies status/category/country/date filters with pagination and sorting', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.count.mockResolvedValue(11);
    prisma.sourcingRequest.findMany.mockResolvedValue([
      {
        id: 42,
        user: { email: 'queue@example.com' },
        budgetChf: 1500,
        category: 'ELECTRONICS',
        country: 'CH',
        condition: 'USED',
        urgency: 'FAST',
        sourcingFeeChf: 150,
        status: RequestStatus.SOURCING,
        feePaidAt: null,
        createdAt: new Date('2026-03-04T10:00:00.000Z'),
        proposals: []
      }
    ]);

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'GET',
      url: '/api/requests?status=SOURCING&category=ELECTRONICS&country=CH&dateFrom=2026-03-01T00:00:00.000Z&dateTo=2026-03-05T23:59:59.999Z&sortBy=budgetChf&sortDir=asc&page=2&pageSize=5'
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.count).toHaveBeenCalledWith({
      where: {
        status: RequestStatus.SOURCING,
        category: 'ELECTRONICS',
        country: 'CH',
        createdAt: {
          gte: new Date('2026-03-01T00:00:00.000Z'),
          lte: new Date('2026-03-05T23:59:59.999Z')
        }
      }
    });
    expect(prisma.sourcingRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: RequestStatus.SOURCING,
          category: 'ELECTRONICS',
          country: 'CH',
          createdAt: {
            gte: new Date('2026-03-01T00:00:00.000Z'),
            lte: new Date('2026-03-05T23:59:59.999Z')
          }
        },
        orderBy: [{ budgetChf: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: 5,
        take: 5
      })
    );

    const payload = response.json() as {
      requests: Array<{ id: number; status: string }>;
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    };

    expect(payload.requests).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 42, status: 'SOURCING' })])
    );
    expect(payload.pagination).toEqual({
      page: 2,
      pageSize: 5,
      total: 11,
      totalPages: 3
    });

    await app.close();
  });

  it('returns validation error when date range is invalid', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests?dateFrom=2026-03-05T00:00:00.000Z&dateTo=2026-03-01T00:00:00.000Z'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'VALIDATION_ERROR'
      })
    );

    await app.close();
  });

  it('defaults to createdAt descending sort when no sort params are provided', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.count.mockResolvedValue(0);
    prisma.sourcingRequest.findMany.mockResolvedValue([]);
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests'
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
      })
    );

    await app.close();
  });

  it('returns validation error when sorting query params are invalid', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests?sortBy=updatedAt&sortDir=up'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'VALIDATION_ERROR'
      })
    );

    await app.close();
  });
});
