import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieGetMock = vi.hoisted(() => vi.fn())
const userFindUniqueMock = vi.hoisted(() => vi.fn())
const participantFindFirstMock = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: cookieGetMock,
  })),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
    },
    participant: {
      findFirst: participantFindFirstMock,
    },
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ userId: 'user-1' })),
    sign: vi.fn(() => 'token'),
  },
}))

vi.mock('@/lib/services/access-link.service', () => ({
  validateAccessLink: vi.fn(),
}))

import { requireProjectAccess, requireProjectAccessWithLink } from '../auth'

describe('project access authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cookieGetMock.mockImplementation((name: string) => {
      if (name === 'auth_token') return { value: 'auth-token' }
      return undefined
    })
    userFindUniqueMock.mockResolvedValue({
      id: 'user-1',
      phone: '09120000000',
      name: 'Test User',
    })
  })

  it('rejects scoped participants from full-access routes', async () => {
    participantFindFirstMock.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      scopes: JSON.stringify(['expenses:read']),
    })

    const result = await requireProjectAccess('project-1')

    expect(result.authorized).toBe(false)
    if (!result.authorized) {
      expect(result.response.status).toBe(403)
    }
  })

  it('allows scoped participants only when required scopes match', async () => {
    participantFindFirstMock.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      scopes: JSON.stringify(['expenses:read']),
    })

    const allowed = await requireProjectAccessWithLink('project-1', ['expenses:read'])
    const denied = await requireProjectAccessWithLink('project-1', ['expenses:create'])

    expect(allowed.authorized).toBe(true)
    expect(denied.authorized).toBe(false)
    if (!denied.authorized) {
      expect(denied.response.status).toBe(403)
    }
  })
})
