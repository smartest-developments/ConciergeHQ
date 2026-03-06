import type { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { hashPassword, verifyPassword } from '../lib/passwordAuth.js'
import {
  buildSessionClearCookie,
  buildSessionCookie,
  createSessionToken,
  getSessionTokenFromCookie,
  hashSessionToken,
  resolveSessionIdentity,
  AUTH_SESSION_COOKIE_TTL_SECONDS
} from '../lib/sessionAuth.js'

const registerSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80).optional()
})

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
})

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase())
})

const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(8).max(128)
})

const MAX_FAILED_LOGIN_ATTEMPTS = 5
const LOGIN_LOCK_WINDOW_MINUTES = 15
const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      })
      return
    }

    const existingUser = await (
      app.prisma as PrismaClient & {
        user: {
          findUnique: (args: { where: { email: string }; select: { id: true } }) => Promise<{ id: number } | null>
        }
      }
    ).user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true }
    })

    if (existingUser) {
      reply.status(409).send({ error: 'EMAIL_ALREADY_REGISTERED' })
      return
    }

    const sessionToken = createSessionToken()
    const expiresAt = new Date(Date.now() + AUTH_SESSION_COOKIE_TTL_SECONDS * 1000)

    const created = await (
      app.prisma as PrismaClient & {
        $transaction: <T>(fn: (tx: {
          user: {
            create: (args: {
              data: {
                email: string
                name?: string
                role: 'CUSTOMER'
              }
              select: { id: true; email: true; role: true }
            }) => Promise<{ id: number; email: string; role: 'CUSTOMER' | 'OPERATOR' | 'ADMIN' }>
          }
          userCredential: {
            create: (args: {
              data: {
                userId: number
                passwordHash: string
              }
            }) => Promise<{ id: number }>
          }
          session: {
            create: (args: {
              data: {
                userId: number
                tokenHash: string
                expiresAt: Date
              }
            }) => Promise<{ id: number }>
          }
        }) => Promise<T>) => Promise<T>
      }
    ).$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          role: 'CUSTOMER'
        },
        select: {
          id: true,
          email: true,
          role: true
        }
      })

      await tx.userCredential.create({
        data: {
          userId: user.id,
          passwordHash: hashPassword(parsed.data.password)
        }
      })

      await tx.session.create({
        data: {
          userId: user.id,
          tokenHash: hashSessionToken(sessionToken),
          expiresAt
        }
      })

      return user
    })

    reply
      .header('Set-Cookie', buildSessionCookie(sessionToken))
      .status(201)
      .send({
        user: {
          id: created.id,
          email: created.email,
          role: created.role
        }
      })
  })

  app.post('/api/auth/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      })
      return
    }

    const now = new Date()
    const user = await (
      app.prisma as PrismaClient & {
        user: {
          findUnique: (args: {
            where: { email: string }
            include: {
              credential: {
                select: {
                  id: true
                  passwordHash: true
                  failedAttemptCount: true
                  lockedUntil: true
                }
              }
            }
          }) => Promise<{
            id: number
            email: string
            role: 'CUSTOMER' | 'OPERATOR' | 'ADMIN'
            credential: {
              id: number
              passwordHash: string
              failedAttemptCount: number
              lockedUntil: Date | null
            } | null
          } | null>
        }
        userCredential: {
          update: (args: {
            where: { id: number }
            data: {
              failedAttemptCount?: number
              lockedUntil?: Date | null
            }
          }) => Promise<{ id: number }>
        }
        session: {
          create: (args: {
            data: {
              userId: number
              tokenHash: string
              expiresAt: Date
            }
          }) => Promise<{ id: number }>
        }
      }
    ).user.findUnique({
      where: {
        email: parsed.data.email
      },
      include: {
        credential: {
          select: {
            id: true,
            passwordHash: true,
            failedAttemptCount: true,
            lockedUntil: true
          }
        }
      }
    })

    if (!user?.credential) {
      reply.status(401).send({ error: 'INVALID_CREDENTIALS' })
      return
    }

    if (user.credential.lockedUntil && user.credential.lockedUntil > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((user.credential.lockedUntil.getTime() - now.getTime()) / 1000))
      reply
        .header('Retry-After', String(retryAfterSeconds))
        .status(429)
        .send({ error: 'AUTH_LOCKED', retryAfterSeconds })
      return
    }

    const validPassword = verifyPassword(parsed.data.password, user.credential.passwordHash)
    if (!validPassword) {
      const nextFailedCount = user.credential.failedAttemptCount + 1
      const shouldLock = nextFailedCount >= MAX_FAILED_LOGIN_ATTEMPTS

      await (
        app.prisma as PrismaClient & {
          userCredential: {
            update: (args: {
              where: { id: number }
              data: {
                failedAttemptCount: number
                lockedUntil: Date | null
              }
            }) => Promise<{ id: number }>
          }
        }
      ).userCredential.update({
        where: { id: user.credential.id },
        data: {
          failedAttemptCount: shouldLock ? 0 : nextFailedCount,
          lockedUntil: shouldLock ? new Date(now.getTime() + LOGIN_LOCK_WINDOW_MINUTES * 60 * 1000) : null
        }
      })

      reply.status(401).send({ error: 'INVALID_CREDENTIALS' })
      return
    }

    await (
      app.prisma as PrismaClient & {
        userCredential: {
          update: (args: {
            where: { id: number }
            data: {
              failedAttemptCount: number
              lockedUntil: null
            }
          }) => Promise<{ id: number }>
        }
      }
    ).userCredential.update({
      where: { id: user.credential.id },
      data: {
        failedAttemptCount: 0,
        lockedUntil: null
      }
    })

    const sessionToken = createSessionToken()
    const expiresAt = new Date(Date.now() + AUTH_SESSION_COOKIE_TTL_SECONDS * 1000)

    await (
      app.prisma as PrismaClient & {
        session: {
          create: (args: {
            data: {
              userId: number
              tokenHash: string
              expiresAt: Date
            }
          }) => Promise<{ id: number }>
        }
      }
    ).session.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(sessionToken),
        expiresAt
      }
    })

    reply
      .header('Set-Cookie', buildSessionCookie(sessionToken))
      .status(200)
      .send({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      })
  })

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

  app.post('/api/auth/forgot-password', async (req, reply) => {
    const parsed = forgotPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      })
      return
    }

    const now = new Date()
    const user = await (
      app.prisma as PrismaClient & {
        user: {
          findUnique: (args: {
            where: { email: string }
            select: { id: true; credential: { select: { id: true } } }
          }) => Promise<{ id: number; credential: { id: number } | null } | null>
        }
      }
    ).user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        credential: {
          select: {
            id: true
          }
        }
      }
    })

    if (user?.credential) {
      const resetToken = createSessionToken()
      const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000)

      await (
        app.prisma as PrismaClient & {
          $transaction: <T>(fn: (tx: {
            passwordResetToken: {
              updateMany: (args: {
                where: { userId: number; consumedAt: null; expiresAt: { gt: Date } }
                data: { consumedAt: Date }
              }) => Promise<{ count: number }>
              create: (args: {
                data: {
                  userId: number
                  tokenHash: string
                  expiresAt: Date
                  requestedByIp: string | null
                }
              }) => Promise<{ id: number }>
            }
          }) => Promise<T>) => Promise<T>
        }
      ).$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({
          where: {
            userId: user.id,
            consumedAt: null,
            expiresAt: { gt: now }
          },
          data: {
            consumedAt: now
          }
        })

        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashSessionToken(resetToken),
            expiresAt,
            requestedByIp: req.ip ?? null
          }
        })
      })
    }

    reply.status(202).send({
      status: 'RESET_LINK_ENQUEUED'
    })
  })

  app.post('/api/auth/reset-password', async (req, reply) => {
    const parsed = resetPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      })
      return
    }

    const now = new Date()
    const tokenHash = hashSessionToken(parsed.data.token)
    const resetToken = await (
      app.prisma as PrismaClient & {
        passwordResetToken: {
          findUnique: (args: {
            where: { tokenHash: string }
            include: {
              user: {
                select: {
                  id: true
                  credential: {
                    select: {
                      id: true
                    }
                  }
                }
              }
            }
          }) => Promise<{
            id: number
            consumedAt: Date | null
            expiresAt: Date
            user: {
              id: number
              credential: {
                id: number
              } | null
            }
          } | null>
        }
      }
    ).passwordResetToken.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: {
          select: {
            id: true,
            credential: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })

    if (!resetToken || resetToken.consumedAt || resetToken.expiresAt <= now || !resetToken.user.credential) {
      reply.status(400).send({ error: 'INVALID_RESET_TOKEN' })
      return
    }

    const credentialId = resetToken.user.credential.id

    await (
      app.prisma as PrismaClient & {
        $transaction: <T>(fn: (tx: {
          userCredential: {
            update: (args: {
              where: { id: number }
              data: {
                passwordHash: string
                failedAttemptCount: number
                lockedUntil: null
              }
            }) => Promise<{ id: number }>
          }
          passwordResetToken: {
            update: (args: {
              where: { id: number }
              data: { consumedAt: Date }
            }) => Promise<{ id: number }>
          }
          session: {
            updateMany: (args: {
              where: { userId: number; revokedAt: null }
              data: { revokedAt: Date }
            }) => Promise<{ count: number }>
          }
        }) => Promise<T>) => Promise<T>
      }
    ).$transaction(async (tx) => {
      await tx.userCredential.update({
        where: {
          id: credentialId
        },
        data: {
          passwordHash: hashPassword(parsed.data.password),
          failedAttemptCount: 0,
          lockedUntil: null
        }
      })

      await tx.passwordResetToken.update({
        where: {
          id: resetToken.id
        },
        data: {
          consumedAt: now
        }
      })

      await tx.session.updateMany({
        where: {
          userId: resetToken.user.id,
          revokedAt: null
        },
        data: {
          revokedAt: now
        }
      })
    })

    reply.status(200).send({
      status: 'PASSWORD_RESET_SUCCESS'
    })
  })
}
