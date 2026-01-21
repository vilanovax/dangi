import { NextRequest, NextResponse } from 'next/server'
import { createExpense, getProjectExpenses } from '@/lib/services/expense.service'
import { getProjectById } from '@/lib/services/project.service'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params
    const expenses = await getProjectExpenses(projectId)

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت هزینه‌ها' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params

    const body = await request.json()
    const {
      title,
      amount,
      description,
      paidById,
      categoryId,
      expenseDate,
      includedParticipantIds
    } = body

    // Validation
    if (!title || amount === undefined || amount === null || !paidById) {
      return NextResponse.json(
        { error: 'عنوان، مبلغ و پرداخت‌کننده الزامی است' },
        { status: 400 }
      )
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید عدد مثبت باشد' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    // Validate payer is a participant
    const payer = project.participants.find(p => p.id === paidById)
    if (!payer) {
      return NextResponse.json(
        { error: 'پرداخت‌کننده عضو پروژه نیست' },
        { status: 400 }
      )
    }

    // Validate included participants if provided
    if (includedParticipantIds && Array.isArray(includedParticipantIds)) {
      if (includedParticipantIds.length === 0) {
        return NextResponse.json(
          { error: 'حداقل یک نفر باید در تقسیم شرکت کند' },
          { status: 400 }
        )
      }

      const projectParticipantIds = project.participants.map(p => p.id)
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

    // Note: paidBy not being in includedParticipantIds is ALLOWED
    // This is a valid use case (e.g., someone pays for others but doesn't share)

    const expense = await createExpense(projectId, {
      title,
      amount: parsedAmount,
      description,
      paidById,
      categoryId: categoryId || undefined,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      includedParticipantIds: includedParticipantIds || undefined,
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت هزینه' },
      { status: 500 }
    )
  }
}
