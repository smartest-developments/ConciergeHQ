import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server.js';

describe('request listing pagination', () => {
  it('returns pagination metadata and applies skip/take defaults', async () => {
    const prismaStub = {
      sourcingRequest: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 42,
            budgetChf: 1800,
            category: 'SPORTS_EQUIPMENT',
            country: 'CH',
            condition: 'USED',
            urgency: 'FAST',
            sourcingFeeChf: 180,
            status: 'FEE_PENDING',
            feePaidAt: null,
            createdAt: new Date('2026-03-04T00:00:00.000Z'),
            user: { email: 'buyer@example.com' },
            proposals: []
          }
        ]),
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
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'GET',
      url: '/api/requests'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1,
      requests: [{ id: 42, userEmail: 'buyer@example.com' }]
    });
    expect(prismaStub.sourcingRequest.count).toHaveBeenCalledWith({
      where: undefined
    });
    expect(prismaStub.sourcingRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20
      })
    );

    await app.close();
  });

  it('applies explicit page and pageSize and validates max pageSize', async () => {
    const prismaStub = {
      sourcingRequest: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
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
    const app = createServer(prismaStub);

    const pagedResponse = await app.inject({
      method: 'GET',
      url: '/api/requests?page=3&pageSize=5&email=buyer@example.com'
    });

    expect(pagedResponse.statusCode).toBe(200);
    expect(pagedResponse.json()).toMatchObject({
      page: 3,
      pageSize: 5,
      total: 0
    });
    expect(prismaStub.sourcingRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5
      })
    );

    const invalidResponse = await app.inject({
      method: 'GET',
      url: '/api/requests?pageSize=101'
    });
    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidResponse.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });
});
