/**
 * Income Category Service
 * CRUD operations for income categories
 */

import { prisma } from '@/lib/db/prisma'

export interface CreateIncomeCategoryInput {
  name: string
  icon?: string
  color?: string
}

export interface UpdateIncomeCategoryInput {
  name?: string
  icon?: string
  color?: string
}

export const incomeCategoryService = {
  /**
   * Create a new income category
   */
  async create(projectId: string, data: CreateIncomeCategoryInput) {
    return await prisma.incomeCategory.create({
      data: {
        ...data,
        projectId,
      },
    })
  },

  /**
   * Get all income categories for a project
   */
  async getAll(projectId: string) {
    return await prisma.incomeCategory.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    })
  },

  /**
   * Get a single income category by ID
   */
  async getById(projectId: string, categoryId: string) {
    return await prisma.incomeCategory.findFirst({
      where: {
        id: categoryId,
        projectId,
      },
    })
  },

  /**
   * Update an income category
   */
  async update(
    projectId: string,
    categoryId: string,
    data: UpdateIncomeCategoryInput
  ) {
    return await prisma.incomeCategory.update({
      where: {
        id: categoryId,
        projectId,
      },
      data,
    })
  },

  /**
   * Delete an income category
   */
  async delete(projectId: string, categoryId: string) {
    return await prisma.incomeCategory.delete({
      where: {
        id: categoryId,
        projectId,
      },
    })
  },

  /**
   * Check if category has any incomes
   */
  async hasIncomes(projectId: string, categoryId: string): Promise<boolean> {
    const count = await prisma.income.count({
      where: {
        projectId,
        categoryId,
      },
    })
    return count > 0
  },
}
