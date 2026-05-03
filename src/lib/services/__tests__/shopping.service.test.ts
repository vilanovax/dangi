import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteShoppingItem,
  ShoppingItemNotFoundError,
  ShoppingParticipantNotFoundError,
  updateShoppingItem,
} from '../shopping.service'
import { prisma } from '@/lib/db/prisma'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    participant: {
      findFirst: vi.fn(),
    },
    shoppingItem: {
      deleteMany: vi.fn(),
    },
  },
}))

const prismaMock = vi.mocked(prisma)

describe('shopping.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateShoppingItem', () => {
    it('scopes item updates to the provided project', async () => {
      const tx = {
        shoppingItem: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findFirstOrThrow: vi.fn().mockResolvedValue({ id: 'item-1' }),
        },
      }

      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx as never))

      await expect(
        updateShoppingItem('project-1', 'item-1', { text: 'نان' })
      ).resolves.toEqual({ id: 'item-1' })

      expect(tx.shoppingItem.updateMany).toHaveBeenCalledWith({
        where: { id: 'item-1', projectId: 'project-1' },
        data: expect.objectContaining({ text: 'نان' }),
      })
      expect(tx.shoppingItem.findFirstOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1', projectId: 'project-1' },
        })
      )
    })

    it('raises not found when an item belongs to another project', async () => {
      const tx = {
        shoppingItem: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          findFirstOrThrow: vi.fn(),
        },
      }

      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx as never))

      await expect(
        updateShoppingItem('project-1', 'item-from-project-2', { text: 'نان' })
      ).rejects.toBeInstanceOf(ShoppingItemNotFoundError)

      expect(tx.shoppingItem.findFirstOrThrow).not.toHaveBeenCalled()
    })

    it('rejects assignment to a participant outside the project', async () => {
      prismaMock.participant.findFirst.mockResolvedValue(null)

      await expect(
        updateShoppingItem('project-1', 'item-1', { assignedToId: 'participant-2' })
      ).rejects.toBeInstanceOf(ShoppingParticipantNotFoundError)

      expect(prismaMock.participant.findFirst).toHaveBeenCalledWith({
        where: { id: 'participant-2', projectId: 'project-1' },
        select: { id: true },
      })
      expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('deleteShoppingItem', () => {
    it('scopes item deletes to the provided project', async () => {
      prismaMock.shoppingItem.deleteMany.mockResolvedValue({ count: 1 })

      await expect(deleteShoppingItem('project-1', 'item-1')).resolves.toBeUndefined()

      expect(prismaMock.shoppingItem.deleteMany).toHaveBeenCalledWith({
        where: { id: 'item-1', projectId: 'project-1' },
      })
    })

    it('raises not found instead of deleting an item from another project', async () => {
      prismaMock.shoppingItem.deleteMany.mockResolvedValue({ count: 0 })

      await expect(
        deleteShoppingItem('project-1', 'item-from-project-2')
      ).rejects.toBeInstanceOf(ShoppingItemNotFoundError)
    })
  })
})
