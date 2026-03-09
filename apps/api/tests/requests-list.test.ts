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
    prisma.session.findUnique.mockResolvedValue({
      id: 300,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 1,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
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
      url: '/api/requests?status=SOURCING&category=ELECTRONICS&country=CH&dateFrom=2026-03-01T00:00:00.000Z&dateTo=2026-03-05T23:59:59.999Z&sortBy=budgetChf&sortDir=asc&page=2&pageSize=5',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator`
      }
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

  it('forces customer session list scope to session owner userId', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 301,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 77,
        email: 'customer@example.com',
        role: 'CUSTOMER'
      }
    });
    prisma.sourcingRequest.count.mockResolvedValue(0);
    prisma.sourcingRequest.findMany.mockResolvedValue([]);

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'GET',
      url: '/api/requests?email=customer@example.com',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=token-customer`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.count).toHaveBeenCalledWith({
      where: {
        userId: 77
      }
    });
    expect(prisma.sourcingRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 77
        }
      })
    );

    await app.close();
  });

  it('rejects customer session list query for a different email', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 302,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 22,
        email: 'customer@example.com',
        role: 'CUSTOMER'
      }
    });

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'GET',
      url: '/api/requests?email=other@example.com',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=token-customer`
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'REQUEST_FORBIDDEN' });
    expect(prisma.sourcingRequest.count).not.toHaveBeenCalled();

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

  it('requires authenticated session for request listing', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'AUTH_REQUIRED' });
    expect(prisma.sourcingRequest.count).not.toHaveBeenCalled();

    await app.close();
  });

  it('defaults to createdAt descending sort when no sort params are provided', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 303,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 1,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
    prisma.sourcingRequest.count.mockResolvedValue(0);
    prisma.sourcingRequest.findMany.mockResolvedValue([]);
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator`
      }
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
    prisma.session.findUnique.mockResolvedValue({
      id: 304,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 1,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
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
          id: 4,
          fromStatus: RequestStatus.SOURCING,
          toStatus: RequestStatus.SOURCING,
          reason: 'Admin disabled account after suspicious payment dispute',
          metadata: {
            operatorRole: 'ADMIN',
            accountStatusChange: {
              disabled: true,
              targetUserId: 19
            }
          },
          occurredAt: new Date('2026-03-05T08:50:00.000Z')
        },
        {
          id: 3,
          fromStatus: RequestStatus.SOURCING,
          toStatus: RequestStatus.SOURCING,
          reason: 'Admin reassigned queue ownership',
          metadata: {
            operatorRole: 'ADMIN',
            roleChange: {
              fromRole: 'OPERATOR',
              toRole: 'ADMIN',
              targetUserId: 19
            }
          },
          occurredAt: new Date('2026-03-05T08:45:00.000Z')
        },
        {
          id: 2,
          fromStatus: RequestStatus.SOURCING,
          toStatus: RequestStatus.PROPOSAL_PUBLISHED,
          reason: 'Proposal published by operator',
          metadata: { proposalId: 7, operatorRole: 'OPERATOR' },
          occurredAt: new Date('2026-03-05T08:30:00.000Z')
        }
      ]
    });

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'GET',
      url: '/api/requests/55',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.sourcingRequest.findUnique).toHaveBeenCalledWith({
      where: { id: 55 },
      include: {
        user: { select: { id: true, email: true } },
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
        proposals: expect.arrayContaining([
          expect.objectContaining({
            id: 7,
            merchantName: 'Zurich Appliance Hub'
          })
        ]),
        statusTimeline: expect.arrayContaining([
          expect.objectContaining({
            id: 2,
            toStatus: 'PROPOSAL_PUBLISHED'
          })
        ]),
        adminAuditTrail: expect.arrayContaining([
          expect.objectContaining({
            id: 4,
            actionType: 'ACCOUNT_STATUS_CHANGE',
            actorRole: 'ADMIN',
            accountStatusChange: {
              disabled: true,
              targetUserId: 19
            }
          }),
          expect.objectContaining({
            id: 3,
            actionType: 'ROLE_CHANGE',
            actorRole: 'ADMIN',
            roleChange: {
              fromRole: 'OPERATOR',
              toRole: 'ADMIN',
              targetUserId: 19
            }
          }),
          expect.objectContaining({
            id: 2,
            actionType: 'PROPOSAL_PUBLISHED',
            actorRole: 'OPERATOR',
            proposalId: 7
          })
        ])
      })
    );

    await app.close();
  });

  it('requires authenticated session for request detail', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests/55'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'AUTH_REQUIRED' });
    expect(prisma.sourcingRequest.findUnique).not.toHaveBeenCalled();

    await app.close();
  });

  it('transitions request to sourcing when current status is fee paid', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 400,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 5,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
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
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator` },
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
    prisma.session.findUnique.mockResolvedValue({
      id: 401,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 5,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
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
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator` },
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
    prisma.session.findUnique.mockResolvedValue({
      id: 402,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 5,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
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
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator` },
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
    prisma.session.findUnique.mockResolvedValue({
      id: 403,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 5,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 55,
      status: RequestStatus.FEE_PENDING
    });
    const app = createServer(prisma as never);

    const invalidPayload = await app.inject({
      method: 'POST',
      url: '/api/requests/55/status',
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator` },
      payload: { toStatus: 'FEE_PAID' }
    });
    expect(invalidPayload.statusCode).toBe(400);

    const invalidTransition = await app.inject({
      method: 'POST',
      url: '/api/requests/55/status',
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator` },
      payload: { toStatus: 'COMPLETED' }
    });
    expect(invalidTransition.statusCode).toBe(409);
    expect(invalidTransition.json()).toEqual({ error: 'INVALID_STATUS_TRANSITION' });

    await app.close();
  });

  it('returns 404 when request detail is missing', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 305,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 1,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
    prisma.sourcingRequest.findUnique.mockResolvedValue(null);
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests/9999',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator`
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'REQUEST_NOT_FOUND' });

    await app.close();
  });

  it('rejects status transition when no operator/admin session is present, even with role header', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/55/status',
      headers: { 'x-operator-role': 'OPERATOR' },
      payload: { toStatus: 'SOURCING' }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'AUTH_REQUIRED' });

    await app.close();
  });
});

describe('support-ticket intake endpoint', () => {
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

  it('creates immutable support-ticket audit event for request owner session', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 501,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 12,
        email: 'customer@example.com',
        role: 'CUSTOMER'
      }
    });
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 91,
      status: RequestStatus.SOURCING,
      user: { id: 12 }
    });
    prisma.requestStatusEvent.create.mockResolvedValue({
      id: 777,
      occurredAt: new Date('2026-03-09T01:45:00.000Z')
    });

    const app = createServer(prisma as never);
    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/91/support-ticket',
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-customer` },
      payload: {
        severity: 'SEV-2',
        source: 'DASHBOARD',
        message: 'Checkout confirmation is missing after payment completion.'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(prisma.requestStatusEvent.create).toHaveBeenCalledWith({
      data: {
        requestId: 91,
        fromStatus: RequestStatus.SOURCING,
        toStatus: RequestStatus.SOURCING,
        reason: 'Support ticket submitted (SEV-2)',
        metadata: {
          supportTicket: {
            severity: 'SEV-2',
            source: 'DASHBOARD',
            message: 'Checkout confirmation is missing after payment completion.',
            submittedByRole: 'CUSTOMER',
            submittedByUserId: 12
          }
        }
      }
    });
    expect(response.json()).toEqual({
      ticketId: 777,
      requestId: 91,
      severity: 'SEV-2',
      status: 'OPEN',
      createdAt: '2026-03-09T01:45:00.000Z'
    });

    await app.close();
  });

  it('rejects support-ticket creation without authenticated session', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/91/support-ticket',
      payload: {
        severity: 'SEV-3',
        source: 'DASHBOARD',
        message: 'Need an update on delivery ETA for this request.'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'AUTH_REQUIRED' });
    expect(prisma.requestStatusEvent.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects customer access to support-ticket creation for another owner request', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 502,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 99,
        email: 'other@example.com',
        role: 'CUSTOMER'
      }
    });
    prisma.sourcingRequest.findUnique.mockResolvedValue({
      id: 44,
      status: RequestStatus.FEE_PAID,
      user: { id: 12 }
    });
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/44/support-ticket',
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-customer` },
      payload: {
        severity: 'SEV-1',
        source: 'DASHBOARD',
        message: 'Critical account mismatch issue that blocks order completion.'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'REQUEST_FORBIDDEN' });
    expect(prisma.requestStatusEvent.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('validates support-ticket payload severity and message length', async () => {
    const prisma = makePrismaMock();
    prisma.session.findUnique.mockResolvedValue({
      id: 503,
      expiresAt: new Date('2030-03-07T10:00:00.000Z'),
      revokedAt: null,
      user: {
        id: 7,
        email: 'operator@example.com',
        role: 'OPERATOR'
      }
    });
    const app = createServer(prisma as never);

    const invalidPayload = await app.inject({
      method: 'POST',
      url: '/api/requests/88/support-ticket',
      headers: { cookie: `${AUTH_SESSION_COOKIE_NAME}=token-operator` },
      payload: {
        severity: 'SEV-4',
        source: 'OPERATOR_QUEUE',
        message: 'too short'
      }
    });

    expect(invalidPayload.statusCode).toBe(400);
    expect(invalidPayload.json()).toEqual(
      expect.objectContaining({
        error: 'VALIDATION_ERROR'
      })
    );
    expect(prisma.sourcingRequest.findUnique).not.toHaveBeenCalled();

    await app.close();
  });
});

describe('checkout/payment/proposal unhappy-path validations', () => {
  const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const originalWebBaseUrl = process.env.WEB_BASE_URL;
  const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
  const originalRateWindowMinutes = process.env.RATE_LIMIT_WINDOW_MINUTES;
  const originalRatePaymentMax = process.env.RATE_LIMIT_PAYMENT_MAX_REQUESTS;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey ?? 'sk_test_123';
    process.env.WEB_BASE_URL = originalWebBaseUrl ?? 'http://localhost:5173';
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins ?? 'http://localhost:5173';
    process.env.RATE_LIMIT_WINDOW_MINUTES = '1';
    process.env.RATE_LIMIT_PAYMENT_MAX_REQUESTS = '1';
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    process.env.WEB_BASE_URL = originalWebBaseUrl;
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins;
    process.env.RATE_LIMIT_WINDOW_MINUTES = originalRateWindowMinutes;
    process.env.RATE_LIMIT_PAYMENT_MAX_REQUESTS = originalRatePaymentMax;
  });

  it('returns deterministic 429 headers for repeated checkout attempts', async () => {
    const prisma = makePrismaMock();
    prisma.sourcingRequest.findUnique.mockResolvedValue(null);
    const app = createServer(prisma as never);

    const firstAttempt = await app.inject({
      method: 'POST',
      url: '/api/requests/12/checkout'
    });
    expect(firstAttempt.statusCode).toBe(404);

    const secondAttempt = await app.inject({
      method: 'POST',
      url: '/api/requests/12/checkout'
    });

    expect(secondAttempt.statusCode).toBe(429);
    expect(secondAttempt.json()).toEqual({ error: 'RATE_LIMITED' });
    expect(secondAttempt.headers['x-ratelimit-limit']).toBe('1');
    expect(secondAttempt.headers['x-ratelimit-remaining']).toBe('0');
    expect(secondAttempt.headers['x-ratelimit-reset']).toBeDefined();
    expect(secondAttempt.headers['retry-after']).toBeDefined();

    await app.close();
  });

  it('returns validation error for confirm-payment payload without sessionId', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/12/confirm-payment',
      payload: {}
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'VALIDATION_ERROR'
      })
    );

    await app.close();
  });

  it('returns auth required for proposal publish without operator identity', async () => {
    const prisma = makePrismaMock();
    const app = createServer(prisma as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/12/proposals',
      payload: {
        merchantName: 'Lens Hub',
        externalUrl: 'https://example.com/proposal'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'AUTH_REQUIRED' });

    await app.close();
  });
});
