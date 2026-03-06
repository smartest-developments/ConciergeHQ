import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer } from '../src/server.js'
import { AUTH_SESSION_COOKIE_NAME, hashSessionToken } from '../src/lib/sessionAuth.js'

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
      upsert: vi.fn()
    },
    session: {
      findUnique: vi.fn(),
      updateMany: vi.fn()
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
      expiresAt: new Date('2026-03-08T00:00:00.000Z'),
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
})
