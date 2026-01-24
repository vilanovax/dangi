import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{ projectId: string; participantId: string }>
}

/**
 * Get all expenses that a participant is involved in (has a share)
 * Returns expenses with the participant's share amount
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, participantId } = await context.params

    // Verify participant exists in this project
    const participant = await prisma.participant.findFirst({
      where: {
        id: participantId,
        projectId,
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'شرکت‌کننده یافت نشد' },
        { status: 404 }
      )
    }

    // Get all expense shares for this participant
    const expenseShares = await prisma.expenseShare.findMany({
      where: {
        participantId,
        expense: {
          projectId,
        },
      },
      include: {
        expense: {
          include: {
            paidBy: true,
            category: true,
          },
        },
      },
      orderBy: {
        expense: {
          expenseDate: 'desc',
        },
      },
    })

    // Transform to a more usable format
    const expenses = expenseShares.map((share) => ({
      id: share.expense.id,
      title: share.expense.title,
      amount: share.expense.amount,
      shareAmount: share.amount,
      expenseDate: share.expense.expenseDate.toISOString(),
      paidById: share.expense.paidById,
      paidBy: {
        id: share.expense.paidBy.id,
        name: share.expense.paidBy.name,
        avatar: share.expense.paidBy.avatar,
      },
      category: share.expense.category
        ? {
            id: share.expense.category.id,
            name: share.expense.category.name,
            icon: share.expense.category.icon,
            color: share.expense.category.color,
          }
        : null,
    }))

    // Calculate totals
    const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalShareAmount = expenses.reduce((sum, e) => sum + e.shareAmount, 0)

    return NextResponse.json({
      expenses,
      summary: {
        count: expenses.length,
        totalExpenseAmount,
        totalShareAmount,
      },
    })
  } catch (error) {
    console.error('Error fetching participant expenses:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت هزینه‌ها' },
      { status: 500 }
    )
  }
}
