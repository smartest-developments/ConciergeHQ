import { describe, expect, it, vi } from 'vitest';
import { RequestStatus } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { expirePublishedProposals } from '../src/jobs/proposalExpiry.js';

function createAppMock() {
  const tx = {
    sourcingRequest: {
      updateMany: vi.fn()
    },
    requestStatusEvent: {
      create: vi.fn()
    }
  };

  const prisma = {
    sourcingRequest: {
      findMany: vi.fn()
    },
    $transaction: vi.fn(async (callback: (txArg: typeof tx) => Promise<boolean>) => callback(tx))
  };

  const app = {
    prisma
  } as unknown as FastifyInstance;

  return { app, prisma, tx };
}

describe('expirePublishedProposals', () => {
  it('marks expired proposals and writes one status event per successful transition', async () => {
    const now = new Date('2026-03-06T11:00:00.000Z');
    const { app, prisma, tx } = createAppMock();

    prisma.sourcingRequest.findMany.mockResolvedValue([
      {
        id: 42,
        status: RequestStatus.PROPOSAL_PUBLISHED,
        proposals: [
          {
            id: 7,
            publishedAt: new Date('2026-03-06T09:00:00.000Z'),
            expiresAt: new Date('2026-03-06T10:59:59.000Z')
          }
        ]
      }
    ]);
    tx.sourcingRequest.updateMany.mockResolvedValue({ count: 1 });

    const updated = await expirePublishedProposals(app, now);

    expect(updated).toBe(1);
    expect(tx.sourcingRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: 42,
        status: RequestStatus.PROPOSAL_PUBLISHED
      },
      data: {
        status: RequestStatus.PROPOSAL_EXPIRED
      }
    });
    expect(tx.requestStatusEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 42,
        fromStatus: RequestStatus.PROPOSAL_PUBLISHED,
        toStatus: RequestStatus.PROPOSAL_EXPIRED,
        reason: 'Proposal expired after 2 hour window'
      })
    });
  });

  it('skips status events when another worker already expired the request', async () => {
    const { app, prisma, tx } = createAppMock();

    prisma.sourcingRequest.findMany.mockResolvedValue([
      {
        id: 10,
        status: RequestStatus.PROPOSAL_PUBLISHED,
        proposals: []
      }
    ]);
    tx.sourcingRequest.updateMany.mockResolvedValue({ count: 0 });

    const updated = await expirePublishedProposals(app, new Date('2026-03-06T11:00:00.000Z'));

    expect(updated).toBe(0);
    expect(tx.requestStatusEvent.create).not.toHaveBeenCalled();
  });
});
