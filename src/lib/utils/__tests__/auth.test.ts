import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  jwtVerify: vi.fn(),
  userFindUnique: vi.fn(),
  participantFindFirst: vi.fn(),
  validateAccessLink: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    participant: {
      findFirst: mocks.participantFindFirst,
    },
  },
}))

vi.mock('@/lib/services/access-link.service', () => ({
  validateAccessLink: mocks.validateAccessLink,
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: mocks.jwtVerify,
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

import { requireProjectAccess, requireProjectAccessWithLink } from '../auth'

const user = {
  id: 'user-1',
  phone: '09120000000',
  name: 'Test User',
}

const participant = {
  id: 'participant-1',
  userId: 'user-1',
  projectId: 'project-1',
}

function mockCookieStore(values: Record<string, string> = {}) {
  mocks.cookies.mockResolvedValue({
    get: (name: string) => {
      const value = values[name]
      return value === undefined ? undefined : { value }
    },
  })
}

describe('project access authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookieStore({ auth_token: 'auth-token' })
    mocks.jwtVerify.mockReturnValue({ userId: user.id })
    mocks.userFindUnique.mockResolvedValue(user)
  })

  it('allows full participants when no scoped permission is required', async () => {
    mocks.participantFindFirst.mockResolvedValue({
      ...participant,
      scopes: null,
    })

    const result = await requireProjectAccess('project-1')

    expect(result.authorized).toBe(true)
  })

  it('denies restricted participants when an endpoint requires full access', async () => {
    mocks.participantFindFirst.mockResolvedValue({
      ...participant,
      scopes: JSON.stringify(['expenses:read', 'project:read']),
    })

    const result = await requireProjectAccess('project-1')

    expect(result.authorized).toBe(false)
    if (!result.authorized) {
      expect(result.response.status).toBe(403)
    }
  })

  it('allows restricted participants only for their granted scopes', async () => {
    mocks.participantFindFirst.mockResolvedValue({
      ...participant,
      scopes: JSON.stringify(['expenses:read', 'project:read']),
    })

    const allowed = await requireProjectAccess('project-1', ['expenses:read'])
    const denied = await requireProjectAccess('project-1', ['expenses:create'])

    expect(allowed.authorized).toBe(true)
    expect(denied.authorized).toBe(false)
  })

  it('enforces participant scopes before granting link-aware API access', async () => {
    mocks.participantFindFirst.mockResolvedValue({
      ...participant,
      scopes: JSON.stringify(['expenses:read', 'project:read']),
    })

    const result = await requireProjectAccessWithLink('project-1', ['expenses:create'])

    expect(result.authorized).toBe(false)
    expect(mocks.validateAccessLink).not.toHaveBeenCalled()
  })
})
