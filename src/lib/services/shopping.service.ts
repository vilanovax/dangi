// Shopping Checklist Service
// Manages shopping items for gathering template projects

import { prisma } from '@/lib/db/prisma'

// Common select for participant info
const participantSelect = {
  id: true,
  name: true,
  avatar: true,
}

async function participantsBelongToProject(
  projectId: string,
  participantIds: Array<string | undefined>
) {
  const uniqueParticipantIds = [...new Set(participantIds.filter(Boolean))] as string[]

  if (uniqueParticipantIds.length === 0) {
    return true
  }

  const count = await prisma.participant.count({
    where: {
      projectId,
      id: { in: uniqueParticipantIds },
    },
  })

  return count === uniqueParticipantIds.length
}

/**
 * Get all shopping items for a project
 * Returns items sorted: unchecked first, then checked
 * Within each group, newest items first
 */
export async function getShoppingItems(projectId: string) {
  const items = await prisma.shoppingItem.findMany({
    where: { projectId },
    include: {
      addedBy: { select: participantSelect },
      assignedTo: { select: participantSelect },
      checkedBy: { select: participantSelect },
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
 * If assignedToId is not provided, defaults to addedById (creator)
 */
export async function createShoppingItem(
  projectId: string,
  data: {
    text: string
    quantity?: string
    note?: string
    addedById?: string
    assignedToId?: string
  }
) {
  const assignedToId = data.assignedToId ?? data.addedById

  if (!(await participantsBelongToProject(projectId, [data.addedById, assignedToId]))) {
    return null
  }

  return await prisma.shoppingItem.create({
    data: {
      text: data.text,
      quantity: data.quantity,
      note: data.note,
      addedById: data.addedById,
      // Default assignedTo to addedBy if not specified
      assignedToId,
      projectId,
    },
    include: {
      addedBy: { select: participantSelect },
      assignedTo: { select: participantSelect },
      checkedBy: { select: participantSelect },
    },
  })
}

/**
 * Update a shopping item
 * When marking as checked, also records who checked it and when
 */
export async function updateShoppingItem(
  projectId: string,
  itemId: string,
  data: {
    text?: string
    isChecked?: boolean
    quantity?: string
    note?: string
    assignedToId?: string
    checkedById?: string // Who is checking this item
  }
) {
  if (!(await participantsBelongToProject(projectId, [data.assignedToId, data.checkedById]))) {
    return null
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (data.text !== undefined) updateData.text = data.text
  if (data.quantity !== undefined) updateData.quantity = data.quantity
  if (data.note !== undefined) updateData.note = data.note
  if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId

  // Handle checked state
  if (data.isChecked !== undefined) {
    updateData.isChecked = data.isChecked
    if (data.isChecked) {
      // Mark as checked: record who and when
      updateData.checkedById = data.checkedById
      updateData.checkedAt = new Date()
    } else {
      // Uncheck: clear checked info
      updateData.checkedById = null
      updateData.checkedAt = null
    }
  }

  const result = await prisma.shoppingItem.updateMany({
    where: { id: itemId, projectId },
    data: updateData,
  })

  if (result.count === 0) {
    return null
  }

  return await prisma.shoppingItem.findUnique({
    where: { id: itemId },
    include: {
      addedBy: { select: participantSelect },
      assignedTo: { select: participantSelect },
      checkedBy: { select: participantSelect },
    },
  })
}

/**
 * Delete a shopping item
 */
export async function deleteShoppingItem(projectId: string, itemId: string) {
  const result = await prisma.shoppingItem.deleteMany({
    where: { id: itemId, projectId },
  })

  return result.count > 0
}
