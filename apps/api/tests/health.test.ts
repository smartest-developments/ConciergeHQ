import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server.js';

const prismaStub = {
  sourcingRequest: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn()
  },
  user: {
    upsert: vi.fn()
  },
  requestStatusEvent: {
    create: vi.fn()
  },
  $transaction: vi.fn()
} as any;

describe('health endpoint', () => {
  it('returns ok payload', async () => {
    const app = createServer(prismaStub);

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('ok');

    await app.close();
  });
});
