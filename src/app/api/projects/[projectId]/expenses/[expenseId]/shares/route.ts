import { NextRequest, NextResponse } from 'next/server'
import { getExpenseById, updateParticipantShare } from '@/lib/services/expense.service'
import { requireFullProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; expenseId: string }>
}

/**
 * PATCH /api/projects/[projectId]/expenses/[expenseId]/shares
 * Update a single participant's share in an expense
 *
 * Body: { participantId: string, amount: number }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, expenseId } = await context.params

    // Authorization check: user must have unrestricted project access
    const authResult = await requireFullProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const existingExpense = await getExpenseById(expenseId)

    if (!existingExpense) {
      return NextResponse.json({ error: 'هزینه یافت نشد' }, { status: 404 })
    }

    if (existingExpense.projectId !== projectId) {
      return NextResponse.json({ error: 'هزینه متعلق به این پروژه نیست' }, { status: 403 })
    }

    const body = await request.json()
    const { participantId, amount } = body

    // Validation
    if (!participantId || typeof participantId !== 'string') {
      return NextResponse.json({ error: 'شناسه شرکت‌کننده الزامی است' }, { status: 400 })
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: 'مبلغ نامعتبر است' }, { status: 400 })
    }

    if (parsedAmount < 0) {
      return NextResponse.json({ error: 'سهم نمی‌تونه منفی باشه' }, { status: 400 })
    }

    if (parsedAmount > existingExpense.amount) {
      return NextResponse.json(
        { error: 'سهم نمی‌تونه بیشتر از کل خرج باشه' },
        { status: 400 }
      )
    }

    // Check if participant has a share in this expense
    const hasShare = existingExpense.shares.some(s => s.participantId === participantId)
    if (!hasShare) {
      return NextResponse.json(
        { error: 'این شخص در این هزینه سهمی ندارد' },
        { status: 400 }
      )
    }

    const result = await updateParticipantShare(expenseId, participantId, parsedAmount)

    return NextResponse.json({
      share: result.share,
      totalShares: result.totalShares,
      sharesMatchTotal: result.sharesMatchTotal,
      expenseAmount: result.expense.amount,
    })
  } catch (error) {
    logApiError(error, { context: 'PATCH /api/projects/[projectId]/expenses/[expenseId]/shares' })

    // Handle known errors
    if (error instanceof Error) {
      if (error.message === 'Share cannot exceed total expense amount') {
        return NextResponse.json(
          { error: 'سهم نمی‌تونه بیشتر از کل خرج باشه' },
          { status: 400 }
        )
      }
      if (error.message === 'Participant does not have a share in this expense') {
        return NextResponse.json(
          { error: 'این شخص در این هزینه سهمی ندارد' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ error: 'خطا در به‌روزرسانی سهم' }, { status: 500 })
  }
}
