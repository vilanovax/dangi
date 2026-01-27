/**
 * Budget Service
 * Monthly budget management for family finance
 */

import { prisma } from '@/lib/db/prisma'
import type { CreateBudgetInput, UpdateBudgetInput, BudgetWithSpending } from '@/types/family'

export const budgetService = {
  /**
   * Create or update a budget for a category in a period
   */
  async upsert(projectId: string, data: CreateBudgetInput) {
    return await prisma.budget.upsert({
      where: {
        projectId_categoryId_periodKey: {
          projectId,
          categoryId: data.categoryId,
          periodKey: data.periodKey,
        },
      },
      create: {
        ...data,
        projectId,
      },
      update: {
        amount: data.amount,
      },
      include: {
        category: true,
      },
    })
  },

  /**
   * Get all budgets for a period
   */
  async getAllForPeriod(projectId: string, periodKey: string) {
    return await prisma.budget.findMany({
      where: {
        projectId,
        periodKey,
      },
      include: {
        category: true,
      },
      orderBy: {
        category: {
          name: 'asc',
        },
      },
    })
  },

  /**
   * Get a single budget by ID
   */
  async getById(projectId: string, budgetId: string) {
    return await prisma.budget.findFirst({
      where: {
        id: budgetId,
        projectId,
      },
      include: {
        category: true,
      },
    })
  },

  /**
   * Get budget for a specific category and period
   */
  async getByCategoryAndPeriod(
    projectId: string,
    categoryId: string,
    periodKey: string
  ) {
    return await prisma.budget.findUnique({
      where: {
        projectId_categoryId_periodKey: {
          projectId,
          categoryId,
          periodKey,
        },
      },
      include: {
        category: true,
      },
    })
  },

  /**
   * Update a budget
   */
  async update(projectId: string, budgetId: string, data: UpdateBudgetInput) {
    return await prisma.budget.update({
      where: {
        id: budgetId,
        projectId,
      },
      data,
      include: {
        category: true,
      },
    })
  },

  /**
   * Delete a budget
   */
  async delete(projectId: string, budgetId: string) {
    return await prisma.budget.delete({
      where: {
        id: budgetId,
        projectId,
      },
    })
  },

  /**
   * Get budgets with spending data for a period
   */
  async getBudgetsWithSpending(
    projectId: string,
    periodKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<BudgetWithSpending[]> {
    // Get all budgets for the period
    const budgets = await prisma.budget.findMany({
      where: {
        projectId,
        periodKey,
      },
      include: {
        category: true,
      },
    })

    // Get expenses for each category in the period
    const budgetsWithSpending: BudgetWithSpending[] = []

    for (const budget of budgets) {
      const expensesSum = await prisma.expense.aggregate({
        where: {
          projectId,
          categoryId: budget.categoryId,
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      })

      const spent = expensesSum._sum.amount || 0
      const remaining = budget.amount - spent
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      const isOverBudget = spent > budget.amount

      budgetsWithSpending.push({
        ...budget,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
        isOverBudget,
      })
    }

    return budgetsWithSpending
  },

  /**
   * Get total budget and total spent for a period
   */
  async getTotalsForPeriod(
    projectId: string,
    periodKey: string,
    startDate: Date,
    endDate: Date
  ) {
    // Total budget
    const budgetSum = await prisma.budget.aggregate({
      where: {
        projectId,
        periodKey,
      },
      _sum: {
        amount: true,
      },
    })

    // Total spent (only for categories that have budgets)
    const budgets = await prisma.budget.findMany({
      where: {
        projectId,
        periodKey,
      },
      select: {
        categoryId: true,
      },
    })

    const categoryIds = budgets.map((b) => b.categoryId)

    const expensesSum = await prisma.expense.aggregate({
      where: {
        projectId,
        categoryId: { in: categoryIds },
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const totalBudget = budgetSum._sum.amount || 0
    const totalSpent = expensesSum._sum.amount || 0
    const budgetUtilization =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
    }
  },

  /**
   * Set budgets for multiple categories at once
   */
  async bulkUpsert(
    projectId: string,
    periodKey: string,
    budgets: Array<{ categoryId: string; amount: number }>
  ) {
    const operations = budgets.map((budget) =>
      prisma.budget.upsert({
        where: {
          projectId_categoryId_periodKey: {
            projectId,
            categoryId: budget.categoryId,
            periodKey,
          },
        },
        create: {
          projectId,
          categoryId: budget.categoryId,
          periodKey,
          amount: budget.amount,
        },
        update: {
          amount: budget.amount,
        },
      })
    )

    return await prisma.$transaction(operations)
  },
}
