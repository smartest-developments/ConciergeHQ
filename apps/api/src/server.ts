import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './lib/prisma.js';
import { registerHealthRoute } from './routes/health.js';
import { registerCategoriesRoute } from './routes/categories.js';
import { registerRequestRoutes } from './routes/requests.js';
import { startProposalExpiryJob } from './jobs/proposalExpiry.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export function createServer(prismaClient: PrismaClient = defaultPrisma) {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true
  });

  app.decorate('prisma', prismaClient);

  app.register(registerHealthRoute);
  app.register(registerCategoriesRoute);
  app.register(registerRequestRoutes);

  const expiryJob = startProposalExpiryJob(app);
  app.addHook('onClose', async () => {
    clearInterval(expiryJob);
  });

  return app;
}
