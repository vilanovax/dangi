// Shopping Checklist Service
// Manages shopping items for gathering template projects

import { prisma } from '@/lib/db/prisma'

/**
 * Get all shopping items for a project
 * Returns items sorted: unchecked first, then checked
 * Within each group, newest items first
 */
export async function getShoppingItems(projectId: string) {
  const items = await prisma.shoppingItem.findMany({
    where: { projectId },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: [
      { isChecked: 'asc' }, // unchecked first (false < true)
      { createdAt: 'desc' }, // newest first within each group
    ],
  })

  // Calculate stats
  const stats = {
    total: items.length,
    checked: items.filter((i) => i.isChecked).length,
    unchecked: items.filter((i) => !i.isChecked).length,
  }

  return { items, stats }
}

/**
 * Create a new shopping item
 */
export async function createShoppingItem(
  projectId: string,
  data: {
    text: string
    quantity?: string
    note?: string
    addedById?: string
  }
) {
  return await prisma.shoppingItem.create({
    data: {
      ...data,
      projectId,
    },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })
}

/**
 * Update a shopping item
 */
export async function updateShoppingItem(
  itemId: string,
  data: {
    text?: string
    isChecked?: boolean
    quantity?: string
    note?: string
  }
) {
  return await prisma.shoppingItem.update({
    where: { id: itemId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })
}

/**
 * Delete a shopping item
 */
export async function deleteShoppingItem(itemId: string) {
  await prisma.shoppingItem.delete({
    where: { id: itemId },
  })
}
