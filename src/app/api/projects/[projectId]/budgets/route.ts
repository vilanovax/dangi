import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getProjectById } from '@/lib/services/project.service'
import { budgetService } from '@/lib/services/budget.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import { parsePeriodKey } from '@/lib/domain/calculators/familyStats'
import type { CreateBudgetInput } from '@/types/family'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/budgets - Get budgets for a period
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

    // Get period from query params
    const { searchParams } = new URL(request.url)
    const periodKey = searchParams.get('period')

    if (!periodKey) {
      return NextResponse.json(
        { error: 'پارامتر period الزامی است (مثال: 1403-10 یا 2024-12)' },
        { status: 400 }
      )
    }

    // Check if we need spending data
    const includeSpending = searchParams.get('includeSpending') === 'true'

    if (includeSpending) {
      // Get budgets with spending data
      const { startDate, endDate } = parsePeriodKey(periodKey)
      const budgets = await budgetService.getBudgetsWithSpending(
        projectId,
        periodKey,
        startDate,
        endDate
      )
      return NextResponse.json({ budgets })
    } else {
      // Get budgets without spending data
      const budgets = await budgetService.getAllForPeriod(projectId, periodKey)
      return NextResponse.json({ budgets })
    }
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/budgets' })
    return NextResponse.json({ error: 'خطا در دریافت بودجه‌ها' }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/budgets - Create or update a budget
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
    if (!body.categoryId || typeof body.categoryId !== 'string') {
      return NextResponse.json(
        { error: 'شناسه دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ بودجه باید عدد مثبت باشد' },
        { status: 400 }
      )
    }

    if (!body.periodKey || typeof body.periodKey !== 'string') {
      return NextResponse.json(
        { error: 'کلید دوره (periodKey) الزامی است' },
        { status: 400 }
      )
    }

    // Validate periodKey format (YYYY-MM)
    const periodKeyPattern = /^\d{4}-\d{2}$/
    if (!periodKeyPattern.test(body.periodKey)) {
      return NextResponse.json(
        { error: 'فرمت periodKey باید YYYY-MM باشد (مثال: 1403-10 یا 2024-12)' },
        { status: 400 }
      )
    }

    // Verify category exists and belongs to project
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

    // Create budget data
    const budgetData: CreateBudgetInput = {
      categoryId: body.categoryId,
      amount: body.amount,
      periodKey: body.periodKey,
    }

    // Create or update budget (upsert)
    const budget = await budgetService.upsert(projectId, budgetData)

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/budgets' })
    return NextResponse.json({ error: 'خطا در ایجاد بودجه' }, { status: 500 })
  }
}
