import { NextRequest, NextResponse } from 'next/server'
import { getExpenseById, updateExpense, deleteExpense } from '@/lib/services/expense.service'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; expenseId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, expenseId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const expense = await getExpenseById(expenseId)

    if (!expense) {
      return NextResponse.json({ error: 'هزینه یافت نشد' }, { status: 404 })
    }

    if (expense.projectId !== projectId) {
      return NextResponse.json({ error: 'هزینه متعلق به این پروژه نیست' }, { status: 403 })
    }

    return NextResponse.json({ expense })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/expenses/[expenseId]' })
    return NextResponse.json({ error: 'خطا در دریافت هزینه' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, expenseId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
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
    const { title, amount, description, paidById, categoryId, expenseDate, includedParticipantIds } =
      body

    // Validation
    if (title !== undefined && (!title || typeof title !== 'string')) {
      return NextResponse.json({ error: 'عنوان نامعتبر است' }, { status: 400 })
    }

    if (amount !== undefined) {
      const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'مبلغ باید عدد مثبت باشد' }, { status: 400 })
      }
    }

    // Check payer if changed
    if (paidById !== undefined) {
      const project = await getProjectById(projectId)
      if (!project) {
        return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
      }

      const payer = project.participants.find((p) => p.id === paidById)
      if (!payer) {
        return NextResponse.json({ error: 'پرداخت‌کننده عضو پروژه نیست' }, { status: 400 })
      }

      // Validate included participants if provided
      if (includedParticipantIds && Array.isArray(includedParticipantIds)) {
        if (includedParticipantIds.length === 0) {
          return NextResponse.json(
            { error: 'حداقل یک نفر باید در تقسیم شرکت کند' },
            { status: 400 }
          )
        }

        const projectParticipantIds = project.participants.map((p) => p.id)
        const invalidIds = includedParticipantIds.filter(
          (id: string) => !projectParticipantIds.includes(id)
        )
        if (invalidIds.length > 0) {
          return NextResponse.json(
            { error: 'برخی از شرکت‌کننده‌های انتخاب شده عضو پروژه نیستند' },
            { status: 400 }
          )
        }
      }
    }

    const expense = await updateExpense(expenseId, {
      title,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      description,
      paidById,
      categoryId: categoryId || undefined,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      includedParticipantIds,
    })

    return NextResponse.json({ expense })
  } catch (error) {
    logApiError(error, { context: 'PATCH /api/projects/[projectId]/expenses/[expenseId]' })
    return NextResponse.json({ error: 'خطا در ویرایش هزینه' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, expenseId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
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

    await deleteExpense(expenseId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, { context: 'DELETE /api/projects/[projectId]/expenses/[expenseId]' })
    return NextResponse.json({ error: 'خطا در حذف هزینه' }, { status: 500 })
  }
}
