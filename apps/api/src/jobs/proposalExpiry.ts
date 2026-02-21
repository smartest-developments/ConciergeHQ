import type { FastifyInstance } from 'fastify';
import { RequestStatus } from '@prisma/client';

const DEFAULT_INTERVAL_MS = 60_000;
const EXPIRY_WINDOW_MS = 2 * 60 * 60 * 1000;

export function startProposalExpiryJob(app: FastifyInstance, intervalMs = DEFAULT_INTERVAL_MS): NodeJS.Timeout {
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      const now = new Date();
      const expiredRequests = await app.prisma.sourcingRequest.findMany({
        where: {
          status: RequestStatus.PROPOSAL_PUBLISHED,
          proposals: {
            some: {
              expiresAt: {
                lte: now
              }
            }
          }
        },
        include: {
          proposals: {
            where: {
              expiresAt: {
                lte: now
              }
            },
            orderBy: { expiresAt: 'desc' },
            take: 1
          }
        }
      });

      for (const request of expiredRequests) {
        const proposal = request.proposals[0];
        await app.prisma.$transaction(async (tx) => {
          await tx.sourcingRequest.update({
            where: { id: request.id },
            data: {
              status: RequestStatus.PROPOSAL_EXPIRED
            }
          });

          await tx.requestStatusEvent.create({
            data: {
              requestId: request.id,
              fromStatus: request.status,
              toStatus: RequestStatus.PROPOSAL_EXPIRED,
              reason: 'Proposal expired after 2 hour window',
              metadata: proposal
                ? {
                    proposalId: proposal.id,
                    expiredAt: now.toISOString(),
                    publishedAt: proposal.publishedAt.toISOString(),
                    expiresAt: proposal.expiresAt.toISOString(),
                    windowMs: EXPIRY_WINDOW_MS
                  }
                : {
                    expiredAt: now.toISOString(),
                    windowMs: EXPIRY_WINDOW_MS
                  }
            }
          });
        });
      }
    } catch (error) {
      app.log.error({ error }, 'Proposal expiry job failed');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  timer.unref();
  return timer;
}
