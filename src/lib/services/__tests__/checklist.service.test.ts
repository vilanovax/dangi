import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError } from '@/lib/errors'

const prismaMock = vi.hoisted(() => ({
  travelChecklistItem: {
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}))

import {
  deleteTravelChecklistItem,
  toggleTravelChecklistItem,
} from '../checklist.service'

describe('checklist.service travel item project scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not toggle an item that belongs to another project', async () => {
    prismaMock.travelChecklistItem.findFirst.mockResolvedValue(null)

    await expect(
      toggleTravelChecklistItem('project-b', 'item-from-project-a', 'done')
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.travelChecklistItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'item-from-project-a',
        projectId: 'project-b',
      },
      select: { id: true },
    })
    expect(prismaMock.travelChecklistItem.update).not.toHaveBeenCalled()
  })

  it('toggles only after finding the item in the same project', async () => {
    const updatedItem = { id: 'item-a', status: 'done' }
    prismaMock.travelChecklistItem.findFirst.mockResolvedValue({ id: 'item-a' })
    prismaMock.travelChecklistItem.update.mockResolvedValue(updatedItem)

    await expect(
      toggleTravelChecklistItem('project-a', 'item-a', 'done')
    ).resolves.toBe(updatedItem)

    expect(prismaMock.travelChecklistItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-a' },
        data: expect.objectContaining({
          status: 'done',
        }),
      })
    )
  })

  it('deletes with both item id and project id', async () => {
    prismaMock.travelChecklistItem.deleteMany.mockResolvedValue({ count: 1 })

    await expect(
      deleteTravelChecklistItem('project-a', 'item-a')
    ).resolves.toBeUndefined()

    expect(prismaMock.travelChecklistItem.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'item-a',
        projectId: 'project-a',
      },
    })
  })

  it('reports missing when delete is attempted through another project', async () => {
    prismaMock.travelChecklistItem.deleteMany.mockResolvedValue({ count: 0 })

    await expect(
      deleteTravelChecklistItem('project-b', 'item-from-project-a')
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
