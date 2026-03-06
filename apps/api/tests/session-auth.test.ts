import { describe, expect, it, vi } from 'vitest';
import type { FastifyRequest } from 'fastify';
import {
  AUTH_SESSION_COOKIE_NAME,
  buildSessionClearCookie,
  buildSessionCookie,
  getSessionTokenFromCookie,
  hashSessionToken,
  resolveSessionIdentity
} from '../src/lib/sessionAuth.js';

describe('session auth helpers', () => {
  it('extracts session token from cookie header', () => {
    const token = getSessionTokenFromCookie(`foo=bar; ${AUTH_SESSION_COOKIE_NAME}=token123; x=y`);
    expect(token).toBe('token123');
    expect(getSessionTokenFromCookie('foo=bar')).toBeNull();
  });

  it('builds session cookie headers deterministically', () => {
    expect(buildSessionCookie('abc', 60)).toContain(`${AUTH_SESSION_COOKIE_NAME}=abc`);
    expect(buildSessionCookie('abc', 60)).toContain('HttpOnly');
    expect(buildSessionClearCookie()).toContain('Max-Age=0');
  });

  it('returns null when token cookie is missing', async () => {
    const prisma = {
      session: {
        findUnique: vi.fn()
      }
    };

    const identity = await resolveSessionIdentity(prisma as never, {
      headers: {}
    } as FastifyRequest);

    expect(identity).toBeNull();
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
  });

  it('resolves non-revoked non-expired session identity', async () => {
    const now = new Date('2026-03-06T10:00:00.000Z');
    const token = 'session-token';

    const prisma = {
      session: {
        findUnique: vi.fn().mockResolvedValue({
          id: 7,
          expiresAt: new Date('2026-03-06T11:00:00.000Z'),
          revokedAt: null,
          user: {
            id: 22,
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        })
      }
    };

    const identity = await resolveSessionIdentity(
      prisma as never,
      {
        headers: {
          cookie: `${AUTH_SESSION_COOKIE_NAME}=${token}`
        }
      } as FastifyRequest,
      now
    );

    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: {
        tokenHash: hashSessionToken(token)
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    expect(identity).toEqual({
      sessionId: 7,
      userId: 22,
      email: 'admin@example.com',
      role: 'ADMIN'
    });
  });

  it('returns null for revoked or expired sessions', async () => {
    const now = new Date('2026-03-06T10:00:00.000Z');
    const token = 'session-token';

    const prisma = {
      session: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: 1,
            expiresAt: new Date('2026-03-06T11:00:00.000Z'),
            revokedAt: new Date('2026-03-06T09:30:00.000Z'),
            user: {
              id: 9,
              email: 'operator@example.com',
              role: 'OPERATOR'
            }
          })
          .mockResolvedValueOnce({
            id: 1,
            expiresAt: new Date('2026-03-06T09:59:59.000Z'),
            revokedAt: null,
            user: {
              id: 9,
              email: 'operator@example.com',
              role: 'OPERATOR'
            }
          })
      }
    };

    const revoked = await resolveSessionIdentity(
      prisma as never,
      {
        headers: {
          cookie: `${AUTH_SESSION_COOKIE_NAME}=${token}`
        }
      } as FastifyRequest,
      now
    );

    const expired = await resolveSessionIdentity(
      prisma as never,
      {
        headers: {
          cookie: `${AUTH_SESSION_COOKIE_NAME}=${token}`
        }
      } as FastifyRequest,
      now
    );

    expect(revoked).toBeNull();
    expect(expired).toBeNull();
  });
});
