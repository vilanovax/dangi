/**
 * Checklist Service
 * Data access layer for standalone checklists
 */

import { prisma } from '@/lib/db/prisma'
import { getTemplateById } from '@/lib/domain/checklist-templates'
import type {
  CreateChecklistInput,
  CreateChecklistFromTemplateInput,
  UpdateChecklistInput,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
  ChecklistFilterParams,
  ChecklistStats,
} from '@/types/checklist'

/**
 * Get all checklists for a user with optional filters
 */
export async function getUserChecklists(
  userId: string,
  filters?: ChecklistFilterParams
) {
  return prisma.checklist.findMany({
    where: {
      userId,
      category: filters?.category,
      isArchived: filters?.includeArchived ? undefined : false,
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get single checklist by ID with all items
 */
export async function getChecklistById(checklistId: string) {
  return prisma.checklist.findUnique({
    where: { id: checklistId },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Create a blank checklist
 */
export async function createChecklist(userId: string, data: CreateChecklistInput) {
  return prisma.checklist.create({
    data: {
      ...data,
      userId,
    },
    include: {
      items: true,
    },
  })
}

/**
 * Create checklist from a template
 */
export async function createChecklistFromTemplate(
  userId: string,
  input: CreateChecklistFromTemplateInput
) {
  const template = getTemplateById(input.templateId)

  if (!template) {
    throw new Error(`Template not found: ${input.templateId}`)
  }

  return prisma.checklist.create({
    data: {
      title: input.customTitle || template.title,
      description: template.description,
      category: template.category,
      icon: template.icon,
      color: template.color,
      userId,
      items: {
        create: template.items.map((item, index) => ({
          text: item.text,
          note: item.note,
          isChecked: item.isChecked || false,
          order: index,
        })),
      },
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  })
}

/**
 * Update checklist metadata
 */
export async function updateChecklist(
  checklistId: string,
  data: UpdateChecklistInput
) {
  return prisma.checklist.update({
    where: { id: checklistId },
    data,
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  })
}

/**
 * Archive or unarchive a checklist
 */
export async function archiveChecklist(checklistId: string, archive: boolean) {
  return prisma.checklist.update({
    where: { id: checklistId },
    data: {
      isArchived: archive,
      archivedAt: archive ? new Date() : null,
    },
  })
}

/**
 * Pin or unpin a checklist
 * Returns the count of currently pinned checklists for the user
 */
export async function pinChecklist(
  checklistId: string,
  userId: string,
  pin: boolean
) {
  // If pinning, check the limit first
  if (pin) {
    const pinnedCount = await prisma.checklist.count({
      where: {
        userId,
        isPinned: true,
      },
    })

    if (pinnedCount >= 3) {
      return { error: 'MAX_PINNED', pinnedCount }
    }
  }

  const updated = await prisma.checklist.update({
    where: { id: checklistId },
    data: {
      isPinned: pin,
      pinnedAt: pin ? new Date() : null,
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  })

  return { checklist: updated }
}

/**
 * Get count of pinned checklists for a user
 */
export async function getPinnedCount(userId: string) {
  return prisma.checklist.count({
    where: {
      userId,
      isPinned: true,
    },
  })
}

/**
 * Delete a checklist permanently
 */
export async function deleteChecklist(checklistId: string) {
  return prisma.checklist.delete({
    where: { id: checklistId },
  })
}

// ═══════════════════════════════════════════════════════════════
// CHECKLIST ITEM OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new checklist item
 */
export async function createChecklistItem(
  checklistId: string,
  data: CreateChecklistItemInput
) {
  // If order not specified, add to end
  if (data.order === undefined) {
    const maxOrder = await prisma.checklistItem.findFirst({
      where: { checklistId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    data.order = (maxOrder?.order ?? -1) + 1
  }

  return prisma.checklistItem.create({
    data: {
      ...data,
      checklistId,
    },
  })
}

/**
 * Update a checklist item
 */
export async function updateChecklistItem(
  itemId: string,
  data: UpdateChecklistItemInput
) {
  return prisma.checklistItem.update({
    where: { id: itemId },
    data,
  })
}

/**
 * Delete a checklist item
 */
export async function deleteChecklistItem(itemId: string) {
  return prisma.checklistItem.delete({
    where: { id: itemId },
  })
}

/**
 * Bulk reorder items (for drag-and-drop)
 */
export async function reorderItems(updates: { id: string; order: number }[]) {
  return Promise.all(
    updates.map((update) =>
      prisma.checklistItem.update({
        where: { id: update.id },
        data: { order: update.order },
      })
    )
  )
}

/**
 * Get checklist statistics (progress)
 */
export async function getChecklistStats(
  checklistId: string
): Promise<ChecklistStats> {
  const items = await prisma.checklistItem.findMany({
    where: { checklistId },
    select: { isChecked: true },
  })

  const total = items.length
  const checked = items.filter((item) => item.isChecked).length
  const unchecked = total - checked
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0

  return {
    total,
    checked,
    unchecked,
    progress,
  }
}

// Export as service object for convenience
export const checklistService = {
  getUserChecklists,
  getChecklistById,
  createChecklist,
  createChecklistFromTemplate,
  updateChecklist,
  archiveChecklist,
  pinChecklist,
  getPinnedCount,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderItems,
  getChecklistStats,
}

// ═══════════════════════════════════════════════════════════════
// TRAVEL CHECKLIST (Project-specific)
// ═══════════════════════════════════════════════════════════════

/**
 * Get all travel checklist items for a project
 */
export async function getTravelChecklist(projectId: string) {
  const items = await prisma.travelChecklistItem.findMany({
    where: { projectId },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' }, // Active first
      { createdAt: 'desc' },
    ],
  })

  return items.map((item) => ({
    id: item.id,
    text: item.text,
    status: item.status as 'active' | 'done',
    createdById: item.createdById,
    createdByName: item.createdBy.name,
    completedAt: item.completedAt?.toISOString() || null,
    projectId: item.projectId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }))
}

/**
 * Create a new travel checklist item
 */
export async function createTravelChecklistItem(
  projectId: string,
  createdById: string,
  text: string
) {
  return prisma.travelChecklistItem.create({
    data: {
      projectId,
      createdById,
      text: text.trim(),
      status: 'active',
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  })
}

/**
 * Toggle travel checklist item status (active ↔ done)
 */
export async function toggleTravelChecklistItem(
  projectId: string,
  itemId: string,
  status: 'active' | 'done'
) {
  const existingItem = await prisma.travelChecklistItem.findFirst({
    where: { id: itemId, projectId },
    select: { id: true },
  })

  if (!existingItem) {
    return null
  }

  return prisma.travelChecklistItem.update({
    where: { id: existingItem.id },
    data: {
      status,
      completedAt: status === 'done' ? new Date() : null,
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  })
}

/**
 * Delete a travel checklist item
 */
export async function deleteTravelChecklistItem(projectId: string, itemId: string) {
  const existingItem = await prisma.travelChecklistItem.findFirst({
    where: { id: itemId, projectId },
    select: { id: true },
  })

  if (!existingItem) {
    return false
  }

  return prisma.travelChecklistItem.delete({
    where: { id: existingItem.id },
  })
}

/**
 * Auto-cleanup: Delete completed items older than 24 hours
 * Run this as a cron job
 */
export async function cleanupCompletedTravelChecklistItems() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const result = await prisma.travelChecklistItem.deleteMany({
    where: {
      status: 'done',
      completedAt: {
        lt: twentyFourHoursAgo,
      },
    },
  })

  return result.count
}
