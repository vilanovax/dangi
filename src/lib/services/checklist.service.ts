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
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderItems,
  getChecklistStats,
}
