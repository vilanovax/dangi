/**
 * Income Service
 * CRUD operations for family income tracking
 */

import { prisma } from '@/lib/db/prisma'
import type {
  CreateIncomeInput,
  UpdateIncomeInput,
  IncomeFilterParams,
} from '@/types/family'

export const incomeService = {
  /**
   * Create a new income entry
   */
  async create(projectId: string, data: CreateIncomeInput) {
    return await prisma.income.create({
      data: {
        ...data,
        projectId,
        incomeDate: data.incomeDate ? new Date(data.incomeDate) : new Date(),
      },
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
    })
  },

  /**
   * Get all incomes for a project with optional filters
   */
  async getAll(projectId: string, filters?: IncomeFilterParams) {
    const where: any = { projectId }

    if (filters?.startDate) {
      where.incomeDate = { ...where.incomeDate, gte: new Date(filters.startDate) }
    }
    if (filters?.endDate) {
      where.incomeDate = { ...where.incomeDate, lte: new Date(filters.endDate) }
    }
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId
    }
    if (filters?.receivedById) {
      where.receivedById = filters.receivedById
    }
    if (filters?.source) {
      where.source = filters.source
    }
    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' }
    }

    return await prisma.income.findMany({
      where,
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
      orderBy: { incomeDate: 'desc' },
    })
  },

  /**
   * Get a single income by ID
   */
  async getById(projectId: string, incomeId: string) {
    return await prisma.income.findFirst({
      where: { id: incomeId, projectId },
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        project: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    })
  },

  /**
   * Update an income entry
   */
  async update(projectId: string, incomeId: string, data: UpdateIncomeInput) {
    const updateData: any = { ...data }
    if (data.incomeDate) {
      updateData.incomeDate = new Date(data.incomeDate)
    }

    return await prisma.income.update({
      where: { id: incomeId, projectId },
      data: updateData,
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
    })
  },

  /**
   * Delete an income entry
   */
  async delete(projectId: string, incomeId: string) {
    return await prisma.income.delete({
      where: { id: incomeId, projectId },
    })
  },

  /**
   * Get total income for a period
   */
  async getTotalForPeriod(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.income.aggregate({
      where: {
        projectId,
        incomeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    return result._sum.amount || 0
  },

  /**
   * Get income breakdown by category
   */
  async getCategoryBreakdown(
    projectId: string,
    startDate: Date,
    endDate: Date
  ) {
    const incomes = await prisma.income.findMany({
      where: {
        projectId,
        incomeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    })

    // Group by category
    const breakdown: Record<string, { name: string; icon?: string; amount: number }> =
      {}

    incomes.forEach((income) => {
      const categoryName = income.category?.name || 'سایر'
      if (!breakdown[categoryName]) {
        breakdown[categoryName] = {
          name: categoryName,
          icon: income.category?.icon || undefined,
          amount: 0,
        }
      }
      breakdown[categoryName].amount += income.amount
    })

    return Object.values(breakdown)
  },

  /**
   * Get recent incomes (last N entries)
   */
  async getRecent(projectId: string, limit: number = 10) {
    return await prisma.income.findMany({
      where: { projectId },
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
      orderBy: { incomeDate: 'desc' },
      take: limit,
    })
  },
}
