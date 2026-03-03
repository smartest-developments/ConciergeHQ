import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestStatus } from '@prisma/client';
import { createServer } from '../src/server.js';

function createPrismaStub() {
  const proposal = {
    id: 7,
    merchantName: 'Alpine Bikes',
    externalUrl: 'https://merchant.example/offer/abc',
    summary: 'Proposal summary',
    publishedAt: new Date('2026-03-03T12:00:00.000Z'),
    expiresAt: new Date('2026-03-03T14:00:00.000Z')
  };

  const updatedRequest = {
    id: 42,
    status: RequestStatus.PROPOSAL_PUBLISHED
  };

  const tx = {
    proposal: {
      create: vi.fn().mockResolvedValue(proposal)
    },
    sourcingRequest: {
      update: vi.fn().mockResolvedValue(updatedRequest)
    },
    requestStatusEvent: {
      create: vi.fn().mockResolvedValue({ id: 10 })
    }
  };

  return {
    sourcingRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn().mockResolvedValue({ id: 42, status: RequestStatus.FEE_PAID }),
      update: vi.fn(),
      create: vi.fn()
    },
    user: {
      upsert: vi.fn()
    },
    proposal: {
      create: vi.fn()
    },
    requestStatusEvent: {
      create: vi.fn()
    },
    $transaction: vi.fn(async (callback) => callback(tx))
  } as any;
}

describe('proposal publishing operator auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPERATOR_API_KEY;
  });

  it('returns 503 when operator auth key is not configured', async () => {
    const prismaStub = createPrismaStub();
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/proposals',
      payload: {
        merchantName: 'Alpine Bikes',
        externalUrl: 'https://merchant.example/offer/abc',
        summary: 'Proposal summary'
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: 'OPERATOR_AUTH_NOT_CONFIGURED' });
    expect(prismaStub.sourcingRequest.findUnique).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns 401 when bearer token is missing or invalid', async () => {
    process.env.OPERATOR_API_KEY = 'operator-secret';

    const prismaStub = createPrismaStub();
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/proposals',
      payload: {
        merchantName: 'Alpine Bikes',
        externalUrl: 'https://merchant.example/offer/abc',
        summary: 'Proposal summary'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'OPERATOR_UNAUTHORIZED' });
    expect(prismaStub.sourcingRequest.findUnique).not.toHaveBeenCalled();

    await app.close();
  });

  it('publishes proposal when valid operator bearer token is provided', async () => {
    process.env.OPERATOR_API_KEY = 'operator-secret';

    const prismaStub = createPrismaStub();
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/proposals',
      headers: {
        authorization: 'Bearer operator-secret'
      },
      payload: {
        merchantName: 'Alpine Bikes',
        externalUrl: 'https://merchant.example/offer/abc',
        summary: 'Proposal summary'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      requestId: 42,
      status: RequestStatus.PROPOSAL_PUBLISHED,
      proposal: {
        id: 7,
        merchantName: 'Alpine Bikes',
        externalUrl: 'https://merchant.example/offer/abc'
      }
    });

    expect(prismaStub.sourcingRequest.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaStub.$transaction).toHaveBeenCalledTimes(1);

    await app.close();
  });
});
