import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer } from '../src/server.js'
import { hashPassword } from '../src/lib/passwordAuth.js'
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_COOKIE_TTL_SECONDS,
  hashSessionToken
} from '../src/lib/sessionAuth.js'

const makePrismaMock = () =>
  ({
    sourcingRequest: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn()
    },
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
    },
    userCredential: {
      create: vi.fn(),
      update: vi.fn()
    },
    passwordResetToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    session: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn()
    },
    requestStatusEvent: {
      create: vi.fn()
    },
    proposal: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }) as const

describe('auth routes', () => {
  const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY
  const originalWebBaseUrl = process.env.WEB_BASE_URL
  const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey ?? 'sk_test_123'
    process.env.WEB_BASE_URL = originalWebBaseUrl ?? 'http://localhost:5173'
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins ?? 'http://localhost:5173'
  })

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey
    process.env.WEB_BASE_URL = originalWebBaseUrl
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins
  })

  it('creates customer account + session on register', async () => {
    const prisma = makePrismaMock()
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.$transaction.mockImplementation(async (handler: any) =>
      handler({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 12,
            email: 'buyer@example.com',
            role: 'CUSTOMER'
          })
        },
        userCredential: {
          create: vi.fn().mockResolvedValue({ id: 1 })
        },
        session: {
          create: vi.fn().mockResolvedValue({ id: 77 })
        }
      })
    )

    const app = createServer(prisma as never)
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'Buyer@Example.com',
        password: 'Passw0rd!'
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      user: {
        id: 12,
        email: 'buyer@example.com',
        role: 'CUSTOMER'
      }
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'buyer@example.com' },
      select: { id: true }
    })
    expect(response.headers['set-cookie']).toContain(`${AUTH_SESSION_COOKIE_NAME}=`)
    expect(response.headers['set-cookie']).toContain(`Max-Age=${AUTH_SESSION_COOKIE_TTL_SECONDS}`)
    await app.close()
  })

  it('returns conflict for duplicate register email', async () => {
    const prisma = makePrismaMock()
    prisma.user.findUnique.mockResolvedValue({ id: 1 })
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'buyer@example.com',
        password: 'Passw0rd!'
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'EMAIL_ALREADY_REGISTERED' })
    await app.close()
  })

  it('returns 401 for auth/me without valid session', async () => {
    const prisma = makePrismaMock()
    prisma.session.findUnique.mockResolvedValue(null)
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me'
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: 'AUTH_REQUIRED' })
    await app.close()
  })

  it('returns normalized user identity for auth/me with active session', async () => {
    const prisma = makePrismaMock()
    prisma.session.findUnique.mockResolvedValue({
      id: 412,
      revokedAt: null,
      expiresAt: new Date('2030-03-08T00:00:00.000Z'),
      user: {
        id: 9,
        email: 'Customer@Example.com ',
        role: 'CUSTOMER'
      }
    })
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=session-token-1`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      user: {
        id: 9,
        email: 'customer@example.com',
        role: 'CUSTOMER'
      }
    })
    expect(prisma.session.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: hashSessionToken('session-token-1') }
      })
    )
    await app.close()
  })

  it('returns invalid credentials on login mismatch and increments failed attempts', async () => {
    const prisma = makePrismaMock()
    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      email: 'buyer@example.com',
      role: 'CUSTOMER',
      credential: {
        id: 56,
        passwordHash: hashPassword('Passw0rd!'),
        failedAttemptCount: 2,
        lockedUntil: null
      }
    })
    prisma.userCredential.update.mockResolvedValue({ id: 56 })
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'buyer@example.com',
        password: 'wrong-password'
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: 'INVALID_CREDENTIALS' })
    expect(prisma.userCredential.update).toHaveBeenCalledWith({
      where: { id: 56 },
      data: {
        failedAttemptCount: 3,
        lockedUntil: null
      }
    })
    await app.close()
  })

  it('returns lock response when credential is currently locked', async () => {
    const prisma = makePrismaMock()
    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      email: 'buyer@example.com',
      role: 'CUSTOMER',
      credential: {
        id: 56,
        passwordHash: 'salt:invalidhash',
        failedAttemptCount: 0,
        lockedUntil: new Date(Date.now() + 60_000)
      }
    })
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'buyer@example.com',
        password: 'Passw0rd!'
      }
    })

    expect(response.statusCode).toBe(429)
    expect(response.json()).toMatchObject({ error: 'AUTH_LOCKED' })
    expect(response.headers['retry-after']).toBeDefined()
    await app.close()
  })

  it('creates session and resets failed attempts on successful login', async () => {
    const prisma = makePrismaMock()
    prisma.user.findUnique.mockResolvedValue({
      id: 9,
      email: 'buyer@example.com',
      role: 'CUSTOMER',
      credential: {
        id: 56,
        passwordHash:
          '0123456789abcdef0123456789abcdef:9a0733f756e33eb6232d7a2fd80b9daef32eeb9f91155123d987057dd36cecdf46bb8f007ed8dd0bd5ca5d2d3f29e88bab9c8c8d93191aaa35d847d11951ad89',
        failedAttemptCount: 3,
        lockedUntil: null
      }
    })
    prisma.userCredential.update.mockResolvedValue({ id: 56 })
    prisma.session.create.mockResolvedValue({ id: 88 })
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'buyer@example.com',
        password: 'Passw0rd!'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      user: {
        id: 9,
        email: 'buyer@example.com',
        role: 'CUSTOMER'
      }
    })
    expect(prisma.userCredential.update).toHaveBeenCalledWith({
      where: { id: 56 },
      data: {
        failedAttemptCount: 0,
        lockedUntil: null
      }
    })
    expect(prisma.session.create).toHaveBeenCalled()
    expect(response.headers['set-cookie']).toContain(`${AUTH_SESSION_COOKIE_NAME}=`)
    await app.close()
  })

  it('revokes cookie session and clears auth cookie on logout', async () => {
    const prisma = makePrismaMock()
    prisma.session.updateMany.mockResolvedValue({ count: 1 })
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        cookie: `${AUTH_SESSION_COOKIE_NAME}=session-token-2`
      }
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tokenHash: hashSessionToken('session-token-2'),
          revokedAt: null
        }
      })
    )
    expect(response.headers['set-cookie']).toContain(`${AUTH_SESSION_COOKIE_NAME}=`)
    expect(response.headers['set-cookie']).toContain('Max-Age=0')
    await app.close()
  })

  it('returns deterministic forgot-password response even when user does not exist', async () => {
    const prisma = makePrismaMock()
    prisma.user.findUnique.mockResolvedValue(null)
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: {
        email: 'missing@example.com'
      }
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({ status: 'RESET_LINK_ENQUEUED' })
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled()
    await app.close()
  })

  it('creates expiring password reset token for existing credential user', async () => {
    const prisma = makePrismaMock()
    prisma.user.findUnique.mockResolvedValue({
      id: 21,
      credential: {
        id: 61
      }
    })
    prisma.$transaction.mockImplementation(async (handler: any) =>
      handler({
        passwordResetToken: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          create: vi.fn().mockResolvedValue({ id: 91 })
        }
      })
    )
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: {
        email: 'buyer@example.com'
      }
    })

    expect(response.statusCode).toBe(202)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    await app.close()
  }, 15_000)

  it('returns invalid reset token for unknown token hash', async () => {
    const prisma = makePrismaMock()
    prisma.passwordResetToken.findUnique.mockResolvedValue(null)
    const app = createServer(prisma as never)

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: {
        token: '12345678901234567890123456789012',
        password: 'N3wPassw0rd!'
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ error: 'INVALID_RESET_TOKEN' })
    await app.close()
  }, 15_000)

  it('resets password, consumes token, and revokes active sessions', async () => {
    const prisma = makePrismaMock()

    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 91,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user: {
        id: 21,
        credential: {
          id: 61
        }
      }
    })
    prisma.$transaction.mockImplementation(async (handler: any) =>
      handler({
        userCredential: {
          update: vi.fn().mockResolvedValue({ id: 61 })
        },
        passwordResetToken: {
          update: vi.fn().mockResolvedValue({ id: 91 })
        },
        session: {
          updateMany: vi.fn().mockResolvedValue({ count: 2 })
        }
      })
    )

    const app = createServer(prisma as never)
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: {
        token: '12345678901234567890123456789012',
        password: 'N3wPassw0rd!'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'PASSWORD_RESET_SUCCESS' })
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    await app.close()
  }, 15_000)
})
