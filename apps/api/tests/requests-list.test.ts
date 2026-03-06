import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestStatus } from '@prisma/client';
import { createServer } from '../src/server.js';

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
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins ?? 'http://localhost:5173';
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

  it('returns request detail with timeline and proposal history', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 55,
      user: { email: 'detail@example.com' },
      budgetChf: 1850,
      sourcingFeeChf: 185,
      specs: 'Need a refurbished espresso machine with warranty.',
      category: 'HOME_APPLIANCES',
      country: 'CH',
      condition: 'USED',
      urgency: 'STANDARD',
      status: RequestStatus.PROPOSAL_PUBLISHED,
      feePaidAt: new Date('2026-03-05T08:10:00.000Z'),
      createdAt: new Date('2026-03-04T09:00:00.000Z'),
      updatedAt: new Date('2026-03-05T08:30:00.000Z'),
      proposals: [
        {
          id: 7,
          merchantName: 'Zurich Appliance Hub',
          externalUrl: 'https://merchant.example/proposal/7',
          summary: 'Inspected refurbished unit with 12-month warranty.',
          publishedAt: new Date('2026-03-05T08:30:00.000Z'),
          expiresAt: new Date('2026-03-05T10:30:00.000Z'),
          actedAt: null
        }
      ],
      statusEvents: [
        {
          id: 2,
          fromStatus: RequestStatus.SOURCING,
          toStatus: RequestStatus.PROPOSAL_PUBLISHED,
          reason: 'Proposal published by operator',
          metadata: { proposalId: 7 },
          occurredAt: new Date('2026-03-05T08:30:00.000Z')
        }
      ]
    });

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'GET',
      url: '/api/requests/55'
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.findUnique).toHaveBeenCalledWith({
      where: { id: 55 },
      include: {
        user: { select: { email: true } },
        proposals: { orderBy: { publishedAt: 'desc' } },
        statusEvents: { orderBy: { occurredAt: 'desc' } }
      }
    });

    expect(response.json()).toEqual(
      expect.objectContaining({
        request: expect.objectContaining({
          id: 55,
          userEmail: 'detail@example.com',
          status: 'PROPOSAL_PUBLISHED'
        }),
        proposals: [
          expect.objectContaining({
            id: 7,
            merchantName: 'Zurich Appliance Hub'
          })
        ],
        statusTimeline: [
          expect.objectContaining({
            id: 2,
            toStatus: 'PROPOSAL_PUBLISHED'
          })
        ]
      })
    );

    await app.close();
  });

  it('transitions request to sourcing when current status is fee paid', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 55,
      status: RequestStatus.FEE_PAID
    });
    prisma.sourcingRequest.update.mockResolvedValue({
      id: 55,
      status: RequestStatus.SOURCING,
      updatedAt: new Date('2026-03-06T04:42:00.000Z')
    });
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/55/status',
      payload: { toStatus: 'SOURCING' }
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.update).toHaveBeenCalledWith({
      where: { id: 55 },
      data: { status: 'SOURCING' }
    });
    expect(prisma.requestStatusEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 55,
        fromStatus: 'FEE_PAID',
        toStatus: 'SOURCING'
      })
    });

    await app.close();
  });

  it('transitions request to completed when proposal is published', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 77,
      status: RequestStatus.PROPOSAL_PUBLISHED
    });
    prisma.sourcingRequest.update.mockResolvedValue({
      id: 77,
      status: RequestStatus.COMPLETED,
      updatedAt: new Date('2026-03-06T09:10:00.000Z')
    });
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/77/status',
      payload: { toStatus: 'COMPLETED' }
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.update).toHaveBeenCalledWith({
      where: { id: 77 },
      data: { status: 'COMPLETED' }
    });
    expect(prisma.requestStatusEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 77,
        fromStatus: 'PROPOSAL_PUBLISHED',
        toStatus: 'COMPLETED'
      })
    });

    await app.close();
  });

  it('transitions request to canceled from sourcing', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 91,
      status: RequestStatus.SOURCING
    });
    prisma.sourcingRequest.update.mockResolvedValue({
      id: 91,
      status: RequestStatus.CANCELED,
      updatedAt: new Date('2026-03-06T09:12:00.000Z')
    });
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/91/status',
      payload: { toStatus: 'CANCELED', reason: 'Customer requested cancellation' }
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.update).toHaveBeenCalledWith({
      where: { id: 91 },
      data: { status: 'CANCELED' }
    });
    expect(prisma.requestStatusEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 91,
        fromStatus: 'SOURCING',
        toStatus: 'CANCELED',
        reason: 'Customer requested cancellation'
      })
    });

    await app.close();
  });

  it('rejects invalid status transition payload and transitions', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 55,
      status: RequestStatus.FEE_PENDING
    });
    const app = createServer(prisma as never);

    const invalidPayload = await app.inject({
      method: 'POST',
      url: '/api/requests/55/status',
      payload: { toStatus: 'FEE_PAID' }
    });
    expect(invalidPayload.statusCode).toBe(400);

    const invalidTransition = await app.inject({
      method: 'POST',
      url: '/api/requests/55/status',
      payload: { toStatus: 'COMPLETED' }
    });
    expect(invalidTransition.statusCode).toBe(409);
    expect(invalidTransition.json()).toEqual({ error: 'INVALID_STATUS_TRANSITION' });

    await app.close();
  });

  it('returns 404 when request detail is missing', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.findUnique.mockResolvedValue(null);
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests/9999'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'REQUEST_NOT_FOUND' });

    await app.close();
  });
});
