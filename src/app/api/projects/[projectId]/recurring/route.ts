import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getProjectById } from '@/lib/services/project.service'
import { recurringService } from '@/lib/services/recurring.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type {
  CreateRecurringTransactionInput,
  RecurringTransactionType,
} from '@/types/family'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/recurring - Get all recurring transactions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    // Authorization check
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if project exists and is family template
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    if (project.template !== 'family') {
      return NextResponse.json(
        { error: 'این API فقط برای تمپلیت خانواده است' },
        { status: 400 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as RecurringTransactionType | null
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Validate type if provided
    if (type && type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json(
        { error: 'نوع تراکنش باید INCOME یا EXPENSE باشد' },
        { status: 400 }
      )
    }

    // Get recurring transactions
    const recurring = activeOnly
      ? await recurringService.getActive(projectId, type || undefined)
      : await recurringService.getAll(projectId, type || undefined)

    return NextResponse.json({ recurring })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/recurring' })
    return NextResponse.json(
      { error: 'خطا در دریافت تراکنش‌های تکراری' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/recurring - Create a recurring transaction
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    // Authorization check
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if project exists and is family template
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    if (project.template !== 'family') {
      return NextResponse.json(
        { error: 'این API فقط برای تمپلیت خانواده است' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.type || (body.type !== 'INCOME' && body.type !== 'EXPENSE')) {
      return NextResponse.json(
        { error: 'نوع تراکنش باید INCOME یا EXPENSE باشد' },
        { status: 400 }
      )
    }

    if (
      !body.title ||
      typeof body.title !== 'string' ||
      body.title.trim().length === 0
    ) {
      return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 })
    }

    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید عدد مثبت باشد' },
        { status: 400 }
      )
    }

    if (
      !body.frequency ||
      !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(body.frequency)
    ) {
      return NextResponse.json(
        { error: 'فرکانس باید DAILY، WEEKLY، MONTHLY یا YEARLY باشد' },
        { status: 400 }
      )
    }

    if (!body.startDate) {
      return NextResponse.json(
        { error: 'تاریخ شروع الزامی است' },
        { status: 400 }
      )
    }

    if (!body.participantId || typeof body.participantId !== 'string') {
      return NextResponse.json(
        { error: 'شناسه شرکت‌کننده الزامی است' },
        { status: 400 }
      )
    }

    // Verify participant exists and belongs to project
    const participant = await prisma.participant.findFirst({
      where: {
        id: body.participantId,
        projectId,
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'شرکت‌کننده یافت نشد یا به این پروژه تعلق ندارد' },
        { status: 404 }
      )
    }

    // Verify category if provided
    if (body.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: body.categoryId,
          projectId,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'دسته‌بندی یافت نشد یا به این پروژه تعلق ندارد' },
          { status: 404 }
        )
      }
    }

    // Create recurring transaction data
    const recurringData: CreateRecurringTransactionInput = {
      type: body.type,
      title: body.title.trim(),
      amount: body.amount,
      frequency: body.frequency,
      startDate: body.startDate,
      endDate: body.endDate || undefined,
      categoryId: body.categoryId || undefined,
      participantId: body.participantId,
      isActive: body.isActive !== undefined ? body.isActive : true,
    }

    // Create recurring transaction
    const recurring = await recurringService.create(projectId, recurringData)

    return NextResponse.json({ recurring }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/recurring' })
    return NextResponse.json(
      { error: 'خطا در ایجاد تراکنش تکراری' },
      { status: 500 }
    )
  }
}
