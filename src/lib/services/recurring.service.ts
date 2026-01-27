/**
 * Recurring Transaction Service
 * Management of recurring income and expenses
 */

import { prisma } from '@/lib/db/prisma'
import type {
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
  RecurringTransactionType,
} from '@/types/family'

export const recurringService = {
  /**
   * Create a new recurring transaction
   */
  async create(projectId: string, data: CreateRecurringTransactionInput) {
    return await prisma.recurringTransaction.create({
      data: {
        ...data,
        projectId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        participant: {
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
   * Get all recurring transactions for a project
   */
  async getAll(projectId: string, type?: RecurringTransactionType) {
    const where: any = { projectId }
    if (type) {
      where.type = type
    }

    return await prisma.recurringTransaction.findMany({
      where,
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Get only active recurring transactions
   */
  async getActive(projectId: string, type?: RecurringTransactionType) {
    const where: any = {
      projectId,
      isActive: true,
    }
    if (type) {
      where.type = type
    }

    return await prisma.recurringTransaction.findMany({
      where,
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Get a single recurring transaction by ID
   */
  async getById(projectId: string, recurringId: string) {
    return await prisma.recurringTransaction.findFirst({
      where: {
        id: recurringId,
        projectId,
      },
      include: {
        participant: {
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
   * Update a recurring transaction
   */
  async update(
    projectId: string,
    recurringId: string,
    data: UpdateRecurringTransactionInput
  ) {
    const updateData: any = { ...data }

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate)
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null
    }

    return await prisma.recurringTransaction.update({
      where: {
        id: recurringId,
        projectId,
      },
      data: updateData,
      include: {
        participant: {
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
   * Delete a recurring transaction
   */
  async delete(projectId: string, recurringId: string) {
    return await prisma.recurringTransaction.delete({
      where: {
        id: recurringId,
        projectId,
      },
    })
  },

  /**
   * Toggle active/inactive status
   */
  async toggle(projectId: string, recurringId: string) {
    const current = await prisma.recurringTransaction.findFirst({
      where: {
        id: recurringId,
        projectId,
      },
      select: {
        isActive: true,
      },
    })

    if (!current) {
      throw new Error('Recurring transaction not found')
    }

    return await prisma.recurringTransaction.update({
      where: {
        id: recurringId,
        projectId,
      },
      data: {
        isActive: !current.isActive,
      },
      include: {
        participant: {
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
   * Mark as processed (update lastProcessed timestamp)
   */
  async markAsProcessed(projectId: string, recurringId: string) {
    return await prisma.recurringTransaction.update({
      where: {
        id: recurringId,
        projectId,
      },
      data: {
        lastProcessed: new Date(),
      },
    })
  },

  /**
   * Get transactions due for processing
   * (active transactions that haven't been processed recently)
   */
  async getDueTransactions(projectId: string) {
    const now = new Date()

    return await prisma.recurringTransaction.findMany({
      where: {
        projectId,
        isActive: true,
        AND: [
          {
            OR: [
              // Never processed
              { lastProcessed: null },
              // Or needs processing based on frequency
              // This is a simplified check - you'd need more complex logic for each frequency type
            ],
          },
          {
            // Not ended yet
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        ],
      },
      include: {
        participant: {
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
   * Calculate total monthly recurring income/expenses
   */
  async getMonthlyTotals(projectId: string) {
    const activeRecurring = await prisma.recurringTransaction.findMany({
      where: {
        projectId,
        isActive: true,
      },
    })

    let monthlyIncome = 0
    let monthlyExpense = 0

    activeRecurring.forEach((transaction) => {
      let monthlyAmount = 0

      // Convert to monthly amount based on frequency
      switch (transaction.frequency) {
        case 'DAILY':
          monthlyAmount = transaction.amount * 30
          break
        case 'WEEKLY':
          monthlyAmount = transaction.amount * 4
          break
        case 'MONTHLY':
          monthlyAmount = transaction.amount
          break
        case 'YEARLY':
          monthlyAmount = transaction.amount / 12
          break
      }

      if (transaction.type === 'INCOME') {
        monthlyIncome += monthlyAmount
      } else {
        monthlyExpense += monthlyAmount
      }
    })

    return {
      monthlyIncome: Math.round(monthlyIncome),
      monthlyExpense: Math.round(monthlyExpense),
      netMonthly: Math.round(monthlyIncome - monthlyExpense),
    }
  },
}
