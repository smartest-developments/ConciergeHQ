import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestStatus } from '@prisma/client';
import { startProposalExpiryJob } from '../src/jobs/proposalExpiry.js';

function createJobContext(options: { proposalExpiresAt: Date; transitionCount?: number }) {
  const tx = {
    sourcingRequest: {
      updateMany: vi.fn().mockResolvedValue({ count: options.transitionCount ?? 1 })
    },
    requestStatusEvent: {
      create: vi.fn().mockResolvedValue({ id: 1 })
    }
  };

  const prisma = {
    sourcingRequest: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 42,
          status: RequestStatus.PROPOSAL_PUBLISHED,
          proposals: [
            {
              id: 7,
              publishedAt: new Date('2026-03-03T12:00:00.000Z'),
              expiresAt: options.proposalExpiresAt
            }
          ]
        }
      ])
    },
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)),
    __tx: tx
  };

  const app = {
    prisma,
    log: {
      error: vi.fn()
    }
  };

  return { app, prisma, tx };
}

describe('proposal expiry job', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03T14:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates a status event when conditional transition succeeds', async () => {
    const { app, tx } = createJobContext({
      proposalExpiresAt: new Date('2026-03-03T14:00:00.000Z')
    });
    const timer = startProposalExpiryJob(app as any, 1000);

    await vi.advanceTimersByTimeAsync(1000);
    clearInterval(timer);

    expect(tx.sourcingRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: 42,
        status: RequestStatus.PROPOSAL_PUBLISHED
      },
      data: {
        status: RequestStatus.PROPOSAL_EXPIRED
      }
    });
    expect(tx.requestStatusEvent.create).toHaveBeenCalledTimes(1);
    expect(tx.requestStatusEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 42,
          fromStatus: RequestStatus.PROPOSAL_PUBLISHED,
          toStatus: RequestStatus.PROPOSAL_EXPIRED
        })
      })
    );
  });

  it('does not write duplicate event when another worker already expired request', async () => {
    const { app, tx } = createJobContext({
      proposalExpiresAt: new Date('2026-03-03T14:00:00.000Z'),
      transitionCount: 0
    });
    const timer = startProposalExpiryJob(app as any, 1000);

    await vi.advanceTimersByTimeAsync(1000);
    clearInterval(timer);

    expect(tx.sourcingRequest.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.requestStatusEvent.create).not.toHaveBeenCalled();
  });

  it('skips transition when latest active proposal is not yet expired', async () => {
    const { app, tx } = createJobContext({
      proposalExpiresAt: new Date('2026-03-03T15:00:00.000Z')
    });
    const timer = startProposalExpiryJob(app as any, 1000);

    await vi.advanceTimersByTimeAsync(1000);
    clearInterval(timer);

    expect(tx.sourcingRequest.updateMany).not.toHaveBeenCalled();
    expect(tx.requestStatusEvent.create).not.toHaveBeenCalled();
  });
});
