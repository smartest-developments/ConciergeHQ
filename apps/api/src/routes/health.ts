import type { FastifyInstance } from 'fastify';

export async function registerHealthRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'acquisition-concierge-api',
      timestamp: new Date().toISOString()
    };
  });
}
