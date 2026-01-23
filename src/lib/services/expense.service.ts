// Expense Service
// Data access layer for expenses

import { prisma } from '@/lib/db/prisma'
import { calculateSplit } from '@/lib/domain/splitters'
import type { ExpenseInput, SplitType } from '@/lib/types/domain'

/**
 * Create a new expense with automatic split calculation
 *
 * @param projectId - The project ID
 * @param input - Expense input data
 * @param input.includedParticipantIds - Optional array of participant IDs to include in split
 *                                        If not provided, all participants are included
 *
 * Note: Paid by someone not included in split is allowed (valid use case)
 * Note: Shares are persisted as snapshots - participant removal doesn't affect history
 */
export async function createExpense(projectId: string, input: ExpenseInput) {
  const {
    title,
    amount,
    description,
    paidById,
    categoryId,
    expenseDate,
    periodKey,
    receiptUrl,
    customShares,
    includedParticipantIds
  } = input

  // Get project and participants for split calculation
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      participants: true,
    },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Filter participants if includedParticipantIds is provided
  // Otherwise, include all participants (default behavior)
  const participantsForSplit = includedParticipantIds
    ? project.participants.filter(p => includedParticipantIds.includes(p.id))
    : project.participants

  if (participantsForSplit.length === 0) {
    throw new Error('At least one participant must be included in the split')
  }

  // Calculate shares based on split type
  // If customShares provided, use MANUAL mode; otherwise use project's default
  const effectiveSplitType: SplitType = customShares ? 'MANUAL' : (project.splitType as SplitType)
  const shares = calculateSplit({
    amount,
    participants: participantsForSplit,
    splitType: effectiveSplitType,
    customShares,
  })

  // Create expense with shares in a transaction
  // Shares are SNAPSHOTS - they preserve the state at creation time
  const expense = await prisma.expense.create({
    data: {
      title,
      amount,
      description,
      paidById,
      categoryId,
      expenseDate: expenseDate || new Date(),
      periodKey,  // دوره زمانی (اختیاری)
      receiptUrl, // تصویر رسید (اختیاری)
      projectId,
      shares: {
        create: shares.map((share) => ({
          participantId: share.participantId,
          amount: share.amount,
          weightAtTime: share.weight, // Snapshot of weight at creation time
        })),
      },
    },
    include: {
      paidBy: true,
      category: true,
      shares: {
        include: {
          participant: true,
        },
      },
    },
  })

  return expense
}

/**
 * Get all expenses for a project
 */
export async function getProjectExpenses(projectId: string) {
  return prisma.expense.findMany({
    where: { projectId },
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
  })
}

/**
 * Get a single expense by ID
 */
export async function getExpenseById(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: true,
      category: true,
      shares: {
        include: {
          participant: true,
        },
      },
    },
  })
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string) {
  return prisma.expense.delete({
    where: { id: expenseId },
  })
}

/**
 * Update an expense (recalculates shares)
 */
export async function updateExpense(
  expenseId: string,
  input: Partial<ExpenseInput>
) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      project: {
        include: {
          participants: true,
        },
      },
      shares: true,
    },
  })

  if (!expense) {
    throw new Error('Expense not found')
  }

  const newAmount = input.amount ?? expense.amount

  // Check if we need to recalculate shares
  const shouldRecalculateShares =
    input.amount !== undefined || input.includedParticipantIds !== undefined

  if (shouldRecalculateShares) {
    // Determine which participants to include
    const participantsForSplit = input.includedParticipantIds
      ? expense.project.participants.filter((p) =>
          input.includedParticipantIds!.includes(p.id)
        )
      : expense.project.participants.filter((p) =>
          expense.shares.some((s) => s.participantId === p.id)
        )

    if (participantsForSplit.length === 0) {
      throw new Error('At least one participant must be included in the split')
    }

    const shares = calculateSplit({
      amount: newAmount,
      participants: participantsForSplit,
      splitType: expense.project.splitType as SplitType,
      customShares: input.customShares,
    })

    // Delete old shares and create new ones
    await prisma.expenseShare.deleteMany({
      where: { expenseId },
    })

    await prisma.expenseShare.createMany({
      data: shares.map((share) => ({
        expenseId,
        participantId: share.participantId,
        amount: share.amount,
        weightAtTime: share.weight,
      })),
    })
  }

  // Update expense
  return prisma.expense.update({
    where: { id: expenseId },
    data: {
      title: input.title,
      amount: input.amount,
      description: input.description,
      paidById: input.paidById,
      categoryId: input.categoryId,
      expenseDate: input.expenseDate,
    },
    include: {
      paidBy: true,
      category: true,
      shares: {
        include: {
          participant: true,
        },
      },
    },
  })
}
