import type { FastifyInstance } from 'fastify';
import { RequestStatus } from '@prisma/client';
import { z } from 'zod';
import { allowedCategories, allowedCountries } from '../domain/constants.js';
import { calculateSourcingFeeChf } from '../domain/fee.js';

const createRequestSchema = z.object({
  userEmail: z.string().email(),
  budgetChf: z.number().positive(),
  specs: z.string().min(10).max(5000),
  category: z.enum(allowedCategories),
  condition: z.enum(['NEW', 'USED']),
  country: z.enum(allowedCountries),
  urgency: z.enum(['STANDARD', 'FAST', 'CRITICAL'])
});

const listRequestsQuerySchema = z.object({
  email: z.string().email().optional()
});

const requestParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export async function registerRequestRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/requests', async (req, reply) => {
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      });
    }

    const payload = parsed.data;
    const fee = calculateSourcingFeeChf(payload.budgetChf);

    const request = await app.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: payload.userEmail },
        update: {},
        create: { email: payload.userEmail }
      });

      const createdRequest = await tx.sourcingRequest.create({
        data: {
          userId: user.id,
          budgetChf: payload.budgetChf,
          specs: payload.specs,
          category: payload.category,
          condition: payload.condition,
          country: payload.country,
          urgency: payload.urgency,
          sourcingFeeChf: fee,
          status: RequestStatus.FEE_PENDING
        }
      });

      await tx.requestStatusEvent.create({
        data: {
          requestId: createdRequest.id,
          toStatus: RequestStatus.FEE_PENDING,
          reason: 'Request created; sourcing fee pending'
        }
      });

      return createdRequest;
    });

    return reply.status(201).send({
      id: request.id,
      status: request.status,
      sourcingFeeChf: Number(request.sourcingFeeChf),
      createdAt: request.createdAt
    });
  });

  app.get('/api/requests', async (req, reply) => {
    const parsed = listRequestsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      });
    }

    const requests = await app.prisma.sourcingRequest.findMany({
      where: parsed.data.email ? { user: { email: parsed.data.email } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } }
      }
    });

    return {
      requests: requests.map((item) => ({
        id: item.id,
        userEmail: item.user.email,
        budgetChf: Number(item.budgetChf),
        category: item.category,
        country: item.country,
        condition: item.condition,
        urgency: item.urgency,
        sourcingFeeChf: Number(item.sourcingFeeChf),
        status: item.status,
        feePaidAt: item.feePaidAt,
        createdAt: item.createdAt
      }))
    };
  });

  app.post('/api/requests/:id/mock-pay', async (req, reply) => {
    const parsed = requestParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      });
    }

    const request = await app.prisma.sourcingRequest.findUnique({ where: { id: parsed.data.id } });
    if (!request) {
      return reply.status(404).send({ error: 'REQUEST_NOT_FOUND' });
    }

    const now = new Date();
    const updated = await app.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.sourcingRequest.update({
        where: { id: parsed.data.id },
        data: {
          feePaidAt: now,
          status: RequestStatus.FEE_PAID
        }
      });

      await tx.requestStatusEvent.create({
        data: {
          requestId: updatedRequest.id,
          fromStatus: request.status,
          toStatus: RequestStatus.FEE_PAID,
          reason: 'Mock payment marked as paid'
        }
      });

      return updatedRequest;
    });

    return {
      id: updated.id,
      status: updated.status,
      feePaidAt: updated.feePaidAt
    };
  });
}
