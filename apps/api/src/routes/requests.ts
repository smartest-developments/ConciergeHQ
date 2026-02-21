import type { FastifyInstance } from 'fastify';
import { RequestStatus } from '@prisma/client';
import { z } from 'zod';
import { allowedCategories, allowedCountries } from '../domain/constants.js';
import { calculateSourcingFeeChf } from '../domain/fee.js';
import { getStripeClient, getWebBaseUrl } from '../lib/stripe.js';

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

const confirmPaymentSchema = z.object({
  sessionId: z.string().min(1)
});

const publishProposalSchema = z.object({
  merchantName: z.string().min(2).max(200),
  externalUrl: z.string().url(),
  summary: z.string().max(2000).optional()
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

  app.post('/api/requests/:id/checkout', async (req, reply) => {
    const parsed = requestParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      });
    }

    const request = await app.prisma.sourcingRequest.findUnique({
      where: { id: parsed.data.id },
      include: { user: { select: { email: true } } }
    });
    if (!request) {
      return reply.status(404).send({ error: 'REQUEST_NOT_FOUND' });
    }

    if (request.status !== RequestStatus.FEE_PENDING) {
      return reply.status(409).send({ error: 'REQUEST_NOT_PAYABLE' });
    }

    const feeChf = Number(request.sourcingFeeChf);
    const amountCents = Math.round(feeChf * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return reply.status(400).send({ error: 'INVALID_FEE_AMOUNT' });
    }

    let stripe: ReturnType<typeof getStripeClient>;
    try {
      stripe = getStripeClient();
    } catch (error) {
      app.log.error({ error }, 'Stripe configuration missing');
      return reply.status(503).send({ error: 'PAYMENT_PROVIDER_UNAVAILABLE' });
    }
    const webBaseUrl = getWebBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      client_reference_id: String(request.id),
      customer_email: request.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'chf',
            unit_amount: amountCents,
            product_data: {
              name: 'Concierge sourcing fee',
              description: 'Non-refundable sourcing fee for research and proposal preparation.'
            }
          }
        }
      ],
      metadata: {
        requestId: String(request.id)
      },
      success_url: `${webBaseUrl}/payment-success?requestId=${request.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webBaseUrl}/payment/${request.id}?fee=${feeChf}&cancelled=true`
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id
    };
  });

  app.post('/api/requests/:id/confirm-payment', async (req, reply) => {
    const parsedParams = requestParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsedParams.error.flatten()
      });
    }

    const parsedBody = confirmPaymentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsedBody.error.flatten()
      });
    }

    const request = await app.prisma.sourcingRequest.findUnique({
      where: { id: parsedParams.data.id },
      include: { user: { select: { email: true } } }
    });
    if (!request) {
      return reply.status(404).send({ error: 'REQUEST_NOT_FOUND' });
    }

    if (request.status === RequestStatus.FEE_PAID) {
      return {
        id: request.id,
        status: request.status,
        feePaidAt: request.feePaidAt
      };
    }

    const feeChf = Number(request.sourcingFeeChf);
    const expectedAmount = Math.round(feeChf * 100);
    let stripe: ReturnType<typeof getStripeClient>;
    try {
      stripe = getStripeClient();
    } catch (error) {
      app.log.error({ error }, 'Stripe configuration missing');
      return reply.status(503).send({ error: 'PAYMENT_PROVIDER_UNAVAILABLE' });
    }
    const session = await stripe.checkout.sessions.retrieve(parsedBody.data.sessionId);

    if (session.client_reference_id !== String(request.id)) {
      return reply.status(400).send({ error: 'SESSION_MISMATCH' });
    }

    if (session.payment_status !== 'paid') {
      return reply.status(409).send({ error: 'PAYMENT_NOT_COMPLETED' });
    }

    if (session.amount_total !== expectedAmount) {
      return reply.status(409).send({ error: 'PAYMENT_AMOUNT_MISMATCH' });
    }

    if (session.currency !== 'chf') {
      return reply.status(409).send({ error: 'PAYMENT_CURRENCY_MISMATCH' });
    }

    const now = new Date();
    const updated = await app.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.sourcingRequest.update({
        where: { id: request.id },
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
          reason: 'Stripe checkout payment confirmed',
          metadata: {
            sessionId: session.id,
            paymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
          }
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

  app.post('/api/requests/:id/proposals', async (req, reply) => {
    const parsedParams = requestParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsedParams.error.flatten()
      });
    }

    const parsedBody = publishProposalSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsedBody.error.flatten()
      });
    }

    const request = await app.prisma.sourcingRequest.findUnique({
      where: { id: parsedParams.data.id }
    });
    if (!request) {
      return reply.status(404).send({ error: 'REQUEST_NOT_FOUND' });
    }

    if (request.status !== RequestStatus.FEE_PAID && request.status !== RequestStatus.SOURCING) {
      return reply.status(409).send({ error: 'REQUEST_NOT_READY_FOR_PROPOSAL' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const payload = parsedBody.data;

    const result = await app.prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          requestId: request.id,
          merchantName: payload.merchantName,
          externalUrl: payload.externalUrl,
          summary: payload.summary,
          publishedAt: now,
          expiresAt
        }
      });

      const updatedRequest = await tx.sourcingRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.PROPOSAL_PUBLISHED
        }
      });

      await tx.requestStatusEvent.create({
        data: {
          requestId: request.id,
          fromStatus: request.status,
          toStatus: RequestStatus.PROPOSAL_PUBLISHED,
          reason: 'Proposal published by operator',
          metadata: {
            proposalId: proposal.id
          }
        }
      });

      return { proposal, updatedRequest };
    });

    return {
      requestId: result.updatedRequest.id,
      status: result.updatedRequest.status,
      proposal: {
        id: result.proposal.id,
        merchantName: result.proposal.merchantName,
        externalUrl: result.proposal.externalUrl,
        summary: result.proposal.summary,
        publishedAt: result.proposal.publishedAt,
        expiresAt: result.proposal.expiresAt
      }
    };
  });
}
