/**
 * Recurring Transactions API Routes
 * GET /api/projects/[projectId]/recurring - List all recurring transactions
 * POST /api/projects/[projectId]/recurring - Create a new recurring transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectService } from '@/lib/services/project.service'
import type { CreateRecurringTransactionInput } from '@/types/family'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'INCOME' | 'EXPENSE' | null (all)
    const isActive = searchParams.get('active') // 'true' | 'false' | null (all)

    // Verify project exists
    const project = await projectService.getById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه پیدا نشد' }, { status: 404 })
    }

    // Verify project is family template
    if (project.template !== 'family') {
      return NextResponse.json(
        { error: 'این ویژگی فقط برای تمپلیت خانواده در دسترس است' },
        { status: 400 }
      )
    }

    const where: any = { projectId }
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const transactions = await prisma.recurringTransaction.findMany({
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
      orderBy: [
        { isActive: 'desc' }, // Active first
        { startDate: 'desc' },
      ],
    })

    return NextResponse.json({
      transactions,
      count: transactions.length,
    })
  } catch (error: any) {
    console.error('Error fetching recurring transactions:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت تراکنش‌های تکراری', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params
    const body = await request.json()

    // Verify project exists
    const project = await projectService.getById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه پیدا نشد' }, { status: 404 })
    }

    // Verify project is family template
    if (project.template !== 'family') {
      return NextResponse.json(
        { error: 'این ویژگی فقط برای تمپلیت خانواده در دسترس است' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.type || !['INCOME', 'EXPENSE'].includes(body.type)) {
      return NextResponse.json(
        { error: 'نوع تراکنش باید INCOME یا EXPENSE باشد' },
        { status: 400 }
      )
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'عنوان تراکنش الزامی است' },
        { status: 400 }
      )
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید بزرگتر از صفر باشد' },
        { status: 400 }
      )
    }

    if (!body.frequency || !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(body.frequency)) {
      return NextResponse.json(
        { error: 'فرکانس باید DAILY، WEEKLY، MONTHLY یا YEARLY باشد' },
        { status: 400 }
      )
    }

    if (!body.participantId) {
      return NextResponse.json(
        { error: 'انتخاب شخص الزامی است' },
        { status: 400 }
      )
    }

    if (!body.startDate) {
      return NextResponse.json(
        { error: 'تاریخ شروع الزامی است' },
        { status: 400 }
      )
    }

    // Verify participant exists
    const participant = await projectService.getParticipant(projectId, body.participantId)
    if (!participant) {
      return NextResponse.json(
        { error: 'شخص در این پروژه وجود ندارد' },
        { status: 404 }
      )
    }

    const transactionData: CreateRecurringTransactionInput = {
      type: body.type,
      title: body.title.trim(),
      amount: parseFloat(body.amount),
      frequency: body.frequency,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      categoryId: body.categoryId,
      participantId: body.participantId,
      isActive: body.isActive !== undefined ? body.isActive : true,
    }

    const transaction = await prisma.recurringTransaction.create({
      data: {
        ...transactionData,
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
      },
    })

    return NextResponse.json(
      {
        message: 'تراکنش تکراری با موفقیت ایجاد شد',
        transaction,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating recurring transaction:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد تراکنش تکراری', details: error.message },
      { status: 500 }
    )
  }
}
