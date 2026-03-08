import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { PrismaClient } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { prisma as defaultPrisma } from './lib/prisma.js';
import { registerHealthRoute } from './routes/health.js';
import { registerCategoriesRoute } from './routes/categories.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerRequestRoutes } from './routes/requests.js';
import { startProposalExpiryJob } from './jobs/proposalExpiry.js';
import { getCorsConfig } from './lib/runtimeConfig.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    requestStartNs?: bigint;
  }
}

export function createServer(prismaClient: PrismaClient = defaultPrisma) {
  const app = Fastify({ logger: true });
  const corsConfig = getCorsConfig();

  app.register(cors, {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, corsConfig.allowedOrigins.includes(origin));
    }
  });

  app.decorate('prisma', prismaClient);

  app.addHook('onRequest', async (request) => {
    request.requestStartNs = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply) => {
    const startNs = request.requestStartNs;
    const latencyMs =
      typeof startNs === 'bigint' ? Number((process.hrtime.bigint() - startNs) / 1000000n) : null;

    request.log.info(
      {
        event: 'http_request_completed',
        service: 'conciergehq-api',
        route: request.routeOptions.url,
        method: request.method,
        requestId: request.id,
        statusCode: reply.statusCode,
        latencyMs
      },
      'request completed'
    );
  });

  app.register(registerHealthRoute);
  app.register(registerCategoriesRoute);
  app.register(registerAuthRoutes);
  app.register(registerRequestRoutes);

  const expiryJob = startProposalExpiryJob(app);
  app.addHook('onClose', async () => {
    clearInterval(expiryJob);
  });

  return app;
}
