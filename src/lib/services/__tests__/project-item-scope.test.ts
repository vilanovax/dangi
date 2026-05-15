import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteTravelChecklistItem,
  toggleTravelChecklistItem,
} from '../checklist.service'
import {
  deleteShoppingItem,
  updateShoppingItem,
} from '../shopping.service'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    shoppingItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    travelChecklistItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('project-scoped item services', () => {
  it('does not update a shopping item outside the requested project', async () => {
    prismaMock.shoppingItem.findFirst.mockResolvedValueOnce(null)

    const item = await updateShoppingItem('project-a', 'item-b', {
      isChecked: true,
      checkedById: 'participant-a',
    })

    expect(item).toBeNull()
    expect(prismaMock.shoppingItem.findFirst).toHaveBeenCalledWith({
      where: { id: 'item-b', projectId: 'project-a' },
      select: { id: true },
    })
    expect(prismaMock.shoppingItem.update).not.toHaveBeenCalled()
  })

  it('updates a shopping item only after matching the project scope', async () => {
    prismaMock.shoppingItem.findFirst.mockResolvedValueOnce({ id: 'item-a' })
    prismaMock.shoppingItem.update.mockResolvedValueOnce({ id: 'item-a' })

    const item = await updateShoppingItem('project-a', 'item-a', {
      text: 'bread',
      isChecked: false,
    })

    expect(item).toEqual({ id: 'item-a' })
    expect(prismaMock.shoppingItem.update).toHaveBeenCalledWith({
      where: { id: 'item-a' },
      data: expect.objectContaining({
        text: 'bread',
        isChecked: false,
        checkedById: null,
        checkedAt: null,
        updatedAt: expect.any(Date),
      }),
      include: expect.any(Object),
    })
  })

  it('does not delete a shopping item outside the requested project', async () => {
    prismaMock.shoppingItem.findFirst.mockResolvedValueOnce(null)

    const deleted = await deleteShoppingItem('project-a', 'item-b')

    expect(deleted).toBe(false)
    expect(prismaMock.shoppingItem.delete).not.toHaveBeenCalled()
  })

  it('does not toggle a travel checklist item outside the requested project', async () => {
    prismaMock.travelChecklistItem.findFirst.mockResolvedValueOnce(null)

    const item = await toggleTravelChecklistItem('project-a', 'item-b', 'done')

    expect(item).toBeNull()
    expect(prismaMock.travelChecklistItem.findFirst).toHaveBeenCalledWith({
      where: { id: 'item-b', projectId: 'project-a' },
      select: { id: true },
    })
    expect(prismaMock.travelChecklistItem.update).not.toHaveBeenCalled()
  })

  it('toggles a travel checklist item only after matching the project scope', async () => {
    prismaMock.travelChecklistItem.findFirst.mockResolvedValueOnce({ id: 'item-a' })
    prismaMock.travelChecklistItem.update.mockResolvedValueOnce({ id: 'item-a' })

    const item = await toggleTravelChecklistItem('project-a', 'item-a', 'done')

    expect(item).toEqual({ id: 'item-a' })
    expect(prismaMock.travelChecklistItem.update).toHaveBeenCalledWith({
      where: { id: 'item-a' },
      data: {
        status: 'done',
        completedAt: expect.any(Date),
      },
      include: expect.any(Object),
    })
  })

  it('does not delete a travel checklist item outside the requested project', async () => {
    prismaMock.travelChecklistItem.findFirst.mockResolvedValueOnce(null)

    const deleted = await deleteTravelChecklistItem('project-a', 'item-b')

    expect(deleted).toBe(false)
    expect(prismaMock.travelChecklistItem.delete).not.toHaveBeenCalled()
  })
})
