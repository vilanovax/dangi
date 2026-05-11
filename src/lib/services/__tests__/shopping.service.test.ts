import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError, ValidationError } from '@/lib/errors'

const prismaMock = vi.hoisted(() => ({
  participant: {
    findFirst: vi.fn(),
  },
  shoppingItem: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}))

import {
  createShoppingItem,
  deleteShoppingItem,
  updateShoppingItem,
} from '../shopping.service'

describe('shopping.service project scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not update an item that belongs to another project', async () => {
    prismaMock.shoppingItem.findFirst.mockResolvedValue(null)

    await expect(
      updateShoppingItem('project-b', 'item-from-project-a', {
        isChecked: true,
        checkedById: 'participant-b',
      })
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.shoppingItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'item-from-project-a',
        projectId: 'project-b',
      },
      select: { id: true },
    })
    expect(prismaMock.shoppingItem.update).not.toHaveBeenCalled()
  })

  it('does not delete an item that belongs to another project', async () => {
    prismaMock.shoppingItem.deleteMany.mockResolvedValue({ count: 0 })

    await expect(
      deleteShoppingItem('project-b', 'item-from-project-a')
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.shoppingItem.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'item-from-project-a',
        projectId: 'project-b',
      },
    })
  })

  it('rejects assignees from a different project', async () => {
    prismaMock.shoppingItem.findFirst.mockResolvedValue({ id: 'item-a' })
    prismaMock.participant.findFirst.mockResolvedValue(null)

    await expect(
      updateShoppingItem('project-a', 'item-a', {
        assignedToId: 'participant-from-project-b',
      })
    ).rejects.toBeInstanceOf(ValidationError)

    expect(prismaMock.participant.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'participant-from-project-b',
        projectId: 'project-a',
      },
      select: { id: true },
    })
    expect(prismaMock.shoppingItem.update).not.toHaveBeenCalled()
  })

  it('creates items only with participants from the same project', async () => {
    const createdItem = { id: 'item-a', text: 'نان' }
    prismaMock.participant.findFirst.mockResolvedValue({ id: 'participant-a' })
    prismaMock.shoppingItem.create.mockResolvedValue(createdItem)

    await expect(
      createShoppingItem('project-a', {
        text: 'نان',
        addedById: 'participant-a',
      })
    ).resolves.toBe(createdItem)

    expect(prismaMock.participant.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'participant-a',
        projectId: 'project-a',
      },
      select: { id: true },
    })
    expect(prismaMock.shoppingItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          addedById: 'participant-a',
          assignedToId: 'participant-a',
          projectId: 'project-a',
        }),
      })
    )
  })
})
