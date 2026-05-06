import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  participant: {
    count: vi.fn(),
  },
  shoppingItem: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
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

  it('updates shopping items only inside the provided project', async () => {
    prismaMock.participant.count.mockResolvedValue(0)
    prismaMock.shoppingItem.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.shoppingItem.findUnique.mockResolvedValue({ id: 'item-1', projectId: 'project-1' })

    await expect(
      updateShoppingItem('project-1', 'item-1', { text: 'نان' })
    ).resolves.toEqual({ id: 'item-1', projectId: 'project-1' })

    expect(prismaMock.shoppingItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1', projectId: 'project-1' },
      })
    )
  })

  it('does not update an item from a different project', async () => {
    prismaMock.participant.count.mockResolvedValue(0)
    prismaMock.shoppingItem.updateMany.mockResolvedValue({ count: 0 })

    await expect(
      updateShoppingItem('project-1', 'item-from-project-2', { isChecked: true })
    ).resolves.toBeNull()

    expect(prismaMock.shoppingItem.findUnique).not.toHaveBeenCalled()
  })

  it('deletes shopping items only inside the provided project', async () => {
    prismaMock.shoppingItem.deleteMany.mockResolvedValue({ count: 0 })

    await expect(deleteShoppingItem('project-1', 'item-from-project-2')).resolves.toBe(false)

    expect(prismaMock.shoppingItem.deleteMany).toHaveBeenCalledWith({
      where: { id: 'item-from-project-2', projectId: 'project-1' },
    })
  })

  it('rejects participant references from other projects when creating items', async () => {
    prismaMock.participant.count.mockResolvedValue(1)

    await expect(
      createShoppingItem('project-1', {
        text: 'نوشابه',
        addedById: 'participant-1',
        assignedToId: 'participant-from-project-2',
      })
    ).resolves.toBeNull()

    expect(prismaMock.shoppingItem.create).not.toHaveBeenCalled()
  })
})
