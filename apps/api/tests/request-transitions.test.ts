import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestStatus } from '@prisma/client';
import { createServer } from '../src/server.js';

const originalEnv = { ...process.env };

type TransitionStubOptions = {
  status: RequestStatus;
  proposalExpiresAt?: Date | null;
};

function createPrismaStub(options: TransitionStubOptions) {
  const requestRecord = {
    id: 42,
    status: options.status
  };

  const activeProposal =
    options.proposalExpiresAt === null
      ? undefined
      : {
          id: 7,
          publishedAt: new Date('2026-03-03T12:00:00.000Z'),
          expiresAt: options.proposalExpiresAt ?? new Date('2099-01-01T00:00:00.000Z'),
          actedAt: null
        };

  const tx = {
    sourcingRequest: {
      update: vi.fn().mockImplementation(async ({ data }) => ({
        id: 42,
        status: data.status
      }))
    },
    proposal: {
      update: vi.fn().mockResolvedValue({
        id: 7,
        actedAt: new Date('2026-03-03T12:30:00.000Z')
      })
    },
    requestStatusEvent: {
      create: vi.fn().mockResolvedValue({ id: 88 })
    }
  };

  return {
    sourcingRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn().mockImplementation(async ({ include }) => {
        if (include?.proposals) {
          return {
            ...requestRecord,
            proposals: activeProposal ? [activeProposal] : []
          };
        }

        return requestRecord;
      }),
      update: vi.fn(),
      create: vi.fn()
    },
    user: {
      upsert: vi.fn()
    },
    proposal: {
      create: vi.fn(),
      update: vi.fn()
    },
    requestStatusEvent: {
      create: vi.fn()
    },
    $transaction: vi.fn(async (callback) => callback(tx)),
    __tx: tx
  } as any;
}

describe('request transition endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv, OPERATOR_API_KEY: 'operator-secret' };
  });

  it('starts sourcing when request is fee paid and operator token is valid', async () => {
    const prismaStub = createPrismaStub({ status: RequestStatus.FEE_PAID });
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/start-sourcing',
      headers: {
        authorization: 'Bearer operator-secret'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: 42,
      status: RequestStatus.SOURCING
    });
    expect(prismaStub.__tx.sourcingRequest.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { status: RequestStatus.SOURCING }
    });

    await app.close();
  });

  it('rejects start-sourcing when request is not fee paid', async () => {
    const prismaStub = createPrismaStub({ status: RequestStatus.FEE_PENDING });
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/start-sourcing',
      headers: {
        authorization: 'Bearer operator-secret'
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ error: 'REQUEST_NOT_READY_FOR_SOURCING' });
    expect(prismaStub.$transaction).not.toHaveBeenCalled();

    await app.close();
  });

  it('completes a published proposal inside action window', async () => {
    const prismaStub = createPrismaStub({ status: RequestStatus.PROPOSAL_PUBLISHED });
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/complete'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 42,
      status: RequestStatus.COMPLETED,
      proposal: {
        id: 7
      }
    });
    expect(prismaStub.__tx.proposal.update).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it('rejects completion when proposal action window already expired', async () => {
    const prismaStub = createPrismaStub({
      status: RequestStatus.PROPOSAL_PUBLISHED,
      proposalExpiresAt: new Date('2000-01-01T00:00:00.000Z')
    });
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/complete'
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ error: 'PROPOSAL_ACTION_WINDOW_EXPIRED' });
    expect(prismaStub.$transaction).not.toHaveBeenCalled();

    await app.close();
  });

  it('cancels a request with an operator-supplied reason', async () => {
    const prismaStub = createPrismaStub({ status: RequestStatus.SOURCING });
    const app = createServer(prismaStub);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requests/42/cancel',
      headers: {
        authorization: 'Bearer operator-secret'
      },
      payload: {
        reason: 'Unsupported supplier due to compliance check'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: 42,
      status: RequestStatus.CANCELED
    });
    expect(prismaStub.__tx.requestStatusEvent.create).toHaveBeenCalledTimes(1);

    await app.close();
  });
});
