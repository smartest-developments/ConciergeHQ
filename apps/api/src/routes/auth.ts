import type { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import {
  buildSessionClearCookie,
  getSessionTokenFromCookie,
  hashSessionToken,
  resolveSessionIdentity
} from '../lib/sessionAuth.js'

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/auth/me', async (req, reply) => {
    const identity = await resolveSessionIdentity(app.prisma, req)
    if (!identity) {
      reply.status(401).send({ error: 'AUTH_REQUIRED' })
      return
    }

    reply.send({
      user: {
        id: identity.userId,
        email: identity.email,
        role: identity.role
      }
    })
  })

  app.post('/api/auth/logout', async (req, reply) => {
    const sessionToken = getSessionTokenFromCookie(req.headers.cookie)
    if (sessionToken) {
      await (
        app.prisma as PrismaClient & {
          session: {
            updateMany: (args: {
              where: { tokenHash: string; revokedAt: null }
              data: { revokedAt: Date }
            }) => Promise<{ count: number }>
          }
        }
      ).session.updateMany({
        where: {
          tokenHash: hashSessionToken(sessionToken),
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      })
    }

    reply.header('Set-Cookie', buildSessionClearCookie()).status(204).send()
  })
}
