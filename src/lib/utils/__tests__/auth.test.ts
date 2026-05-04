import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    participant: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/services/access-link.service', () => ({
  validateAccessLink: vi.fn(),
}))

import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import {
  generateToken,
  requireFullProjectAccess,
  requireProjectAccessWithLink,
} from '../auth'

const mockedCookies = vi.mocked(cookies)
const mockedFindUnique = vi.mocked(prisma.user.findUnique)
const mockedFindParticipant = vi.mocked(prisma.participant.findFirst)

describe('project authorization helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedCookies.mockResolvedValue({
      get: vi.fn((name: string) => (
        name === 'auth_token' ? { value: generateToken('user-1') } : undefined
      )),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockedFindUnique.mockResolvedValue({
      id: 'user-1',
      phone: '09120000000',
      name: 'Test User',
    })
  })

  it('rejects scoped participants when they lack required API scopes', async () => {
    mockedFindParticipant.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      scopes: JSON.stringify(['expenses:read', 'project:read']),
    })

    const result = await requireProjectAccessWithLink('project-1', ['expenses:create'])

    expect(result.authorized).toBe(false)
    if (!result.authorized) {
      expect(result.response.status).toBe(403)
    }
  })

  it('allows scoped participants when they have all required API scopes', async () => {
    mockedFindParticipant.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      scopes: JSON.stringify(['expenses:read', 'expenses:create', 'project:read']),
    })

    const result = await requireProjectAccessWithLink('project-1', ['expenses:create'])

    expect(result.authorized).toBe(true)
  })

  it('rejects scoped participants from full-member-only operations', async () => {
    mockedFindParticipant.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      scopes: JSON.stringify(['expenses:read', 'expenses:create']),
    })

    const result = await requireFullProjectAccess('project-1')

    expect(result.authorized).toBe(false)
    if (!result.authorized) {
      expect(result.response.status).toBe(403)
    }
  })

  it('allows unrestricted participants for full-member-only operations', async () => {
    mockedFindParticipant.mockResolvedValue({
      id: 'participant-1',
      userId: 'user-1',
      projectId: 'project-1',
      scopes: null,
    })

    const result = await requireFullProjectAccess('project-1')

    expect(result.authorized).toBe(true)
  })
})
