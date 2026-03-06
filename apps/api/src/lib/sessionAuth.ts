import { createHash, randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { FastifyRequest } from 'fastify';

export const AUTH_SESSION_COOKIE_NAME = 'acq_session';
export const AUTH_SESSION_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = 'CUSTOMER' | 'OPERATOR' | 'ADMIN';

export type SessionIdentity = {
  sessionId: number;
  userId: number;
  role: SessionRole;
};

function parseCookies(rawCookieHeader: string | undefined): Record<string, string> {
  if (!rawCookieHeader) {
    return {};
  }

  return rawCookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cookiePair) => {
      const separatorIndex = cookiePair.indexOf('=');
      if (separatorIndex <= 0) {
        return acc;
      }

      const name = cookiePair.slice(0, separatorIndex).trim();
      const value = cookiePair.slice(separatorIndex + 1).trim();
      if (!name) {
        return acc;
      }

      acc[name] = decodeURIComponent(value);
      return acc;
    }, {});
}

export function createSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionTokenFromCookie(rawCookieHeader: string | undefined): string | null {
  const cookies = parseCookies(rawCookieHeader);
  const token = cookies[AUTH_SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  return token;
}

export function buildSessionCookie(token: string, maxAgeSeconds: number = AUTH_SESSION_COOKIE_TTL_SECONDS): string {
  return `${AUTH_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function buildSessionClearCookie(): string {
  return `${AUTH_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function resolveSessionIdentity(
  prisma: PrismaClient,
  request: FastifyRequest,
  now: Date = new Date()
): Promise<SessionIdentity | null> {
  const token = getSessionTokenFromCookie(request.headers.cookie);
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await (
    prisma as PrismaClient & {
      session: {
        findUnique: (args: {
          where: { tokenHash: string };
          include: {
            user: {
              select: {
                id: true;
                role: true;
              };
            };
          };
        }) => Promise<{
          id: number;
          revokedAt: Date | null;
          expiresAt: Date;
          user: { id: number; role: string };
        } | null>;
      };
    }
  ).session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          role: true
        }
      }
    }
  });

  if (!session || session.revokedAt || session.expiresAt <= now) {
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.user.id,
    role: session.user.role as SessionRole
  };
}
