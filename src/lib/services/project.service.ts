// Project Service
// Data access layer for projects

import { prisma } from '@/lib/db/prisma'
import { getTemplate } from '@/lib/domain/templates'
import type { SplitType } from '@/lib/types/domain'

interface CreateProjectInput {
  name: string
  description?: string
  template?: string
  ownerName: string
  userId?: string // اتصال به کاربر لاگین شده (اختیاری)
}

interface ProjectWithParticipants {
  id: string
  name: string
  description: string | null
  template: string
  splitType: string
  currency: string
  shareCode: string
  createdAt: Date
  participants: {
    id: string
    name: string
    role: string
    sessionToken: string
  }[]
}

/**
 * Create a new project with owner and default categories
 */
export async function createProject(input: CreateProjectInput): Promise<{
  project: ProjectWithParticipants
  ownerToken: string
}> {
  const { name, description, template = 'travel', ownerName, userId } = input

  const templateDef = getTemplate(template)

  const project = await prisma.project.create({
    data: {
      name,
      description,
      template,
      splitType: templateDef.defaultSplitType as SplitType,
      // Create owner participant (linked to user if logged in)
      participants: {
        create: {
          name: ownerName,
          role: 'OWNER',
          userId: userId || null, // اتصال به کاربر اگر لاگین کرده باشه
        },
      },
      // Create default categories from template
      categories: {
        create: templateDef.defaultCategories.map((cat) => ({
          name: cat.nameFa,
          icon: cat.icon,
          color: cat.color,
        })),
      },
    },
    include: {
      participants: true,
    },
  })

  const owner = project.participants[0]

  return {
    project,
    ownerToken: owner.sessionToken,
  }
}

/**
 * Get project by ID with all relations
 * @param includeExpenses - Whether to include full expense data (default: true for backward compatibility)
 */
export async function getProjectById(projectId: string, includeExpenses = true) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      participants: true,
      categories: true,
      expenses: includeExpenses
        ? {
            include: {
              paidBy: true,
              category: true,
              shares: {
                include: {
                  participant: true,
                },
              },
            },
            orderBy: {
              expenseDate: 'desc',
            },
            take: 10, // Only fetch recent 10 expenses for dashboard preview
          }
        : false,
    },
  })
}

/**
 * Get project by share code (for join link)
 */
export async function getProjectByShareCode(shareCode: string) {
  return prisma.project.findUnique({
    where: { shareCode },
    include: {
      participants: true,
    },
  })
}

/**
 * Update project settings
 */
export async function updateProject(
  projectId: string,
  data: {
    name?: string
    description?: string | null
    splitType?: SplitType
    currency?: string
    chargeYear?: number | null
    isArchived?: boolean
    archivedAt?: Date | null
  }
) {
  // Filter out undefined values
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.splitType !== undefined) updateData.splitType = data.splitType
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.chargeYear !== undefined) updateData.chargeYear = data.chargeYear
  if (data.isArchived !== undefined) updateData.isArchived = data.isArchived
  if (data.archivedAt !== undefined) updateData.archivedAt = data.archivedAt

  return prisma.project.update({
    where: { id: projectId },
    data: updateData,
  })
}

/**
 * Delete a project and all related data
 */
export async function deleteProject(projectId: string) {
  return prisma.project.delete({
    where: { id: projectId },
  })
}
