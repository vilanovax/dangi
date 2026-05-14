import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateToken, requireProjectAccessWithLink, requireProjectOwnerAccess } from '../auth'

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  findUniqueUser: vi.fn(),
  findFirstParticipant: vi.fn(),
  validateAccessLink: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
  })),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    participant: {
      findFirst: mocks.findFirstParticipant,
    },
  },
}))

vi.mock('@/lib/services/access-link.service', () => ({
  validateAccessLink: mocks.validateAccessLink,
}))

function authenticateUser() {
  const token = generateToken('user-1')

  mocks.cookieGet.mockImplementation((name: string) => {
    if (name === 'auth_token') {
      return { value: token }
    }

    if (name === 'access_token') {
      return { value: 'link-token' }
    }

    return undefined
  })

  mocks.findUniqueUser.mockResolvedValue({
    id: 'user-1',
    phone: '09120000000',
    name: 'Test User',
  })
}

describe('project access authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticateUser()
  })

  it('denies scoped participants that lack the required API scope', async () => {
    mocks.findFirstParticipant.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      role: 'MEMBER',
      scopes: JSON.stringify(['expenses:read']),
    })

    const result = await requireProjectAccessWithLink('project-1', ['expenses:create'])

    expect(result.authorized).toBe(false)
    if (!result.authorized) {
      expect(result.response.status).toBe(403)
    }
    expect(mocks.validateAccessLink).not.toHaveBeenCalled()
  })

  it('allows scoped participants when their stored scopes satisfy the route', async () => {
    mocks.findFirstParticipant.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      role: 'MEMBER',
      scopes: JSON.stringify(['expenses:read', 'expenses:create']),
    })

    const result = await requireProjectAccessWithLink('project-1', ['expenses:create'])

    expect(result.authorized).toBe(true)
    if (result.authorized) {
      expect(result.accessType).toBe('participant')
    }
  })

  it('allows only unrestricted project owners for owner-only routes', async () => {
    mocks.findFirstParticipant.mockResolvedValueOnce({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      role: 'MEMBER',
      scopes: null,
    })

    const memberResult = await requireProjectOwnerAccess('project-1')
    expect(memberResult.authorized).toBe(false)
    if (!memberResult.authorized) {
      expect(memberResult.response.status).toBe(403)
    }

    mocks.findFirstParticipant.mockResolvedValueOnce({
      id: 'participant-2',
      userId: 'user-1',
      projectId: 'project-1',
      role: 'OWNER',
      scopes: null,
    })

    const ownerResult = await requireProjectOwnerAccess('project-1')
    expect(ownerResult.authorized).toBe(true)
  })
})
