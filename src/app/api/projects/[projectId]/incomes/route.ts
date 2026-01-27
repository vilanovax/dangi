import { NextRequest, NextResponse } from 'next/server'
import { incomeService } from '@/lib/services/income.service'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { CreateIncomeInput, IncomeFilterParams } from '@/types/family'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/incomes - Get all incomes
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const filters: IncomeFilterParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      receivedById: searchParams.get('receivedById') || undefined,
      source: searchParams.get('source') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const incomes = await incomeService.getAll(projectId, filters)

    return NextResponse.json({ incomes })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/incomes' })
    return NextResponse.json({ error: 'خطا در دریافت درآمدها' }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/incomes - Create a new income
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

    const body = await request.json()

    // Validation
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'عنوان درآمد الزامی است' }, { status: 400 })
    }

    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ error: 'مبلغ باید عدد مثبت باشد' }, { status: 400 })
    }

    if (!body.receivedById || typeof body.receivedById !== 'string') {
      return NextResponse.json({ error: 'دریافت‌کننده الزامی است' }, { status: 400 })
    }

    const incomeData: CreateIncomeInput = {
      title: body.title.trim(),
      amount: body.amount,
      description: body.description || undefined,
      source: body.source || undefined,
      incomeDate: body.incomeDate || undefined,
      categoryId: body.categoryId || undefined,
      receivedById: body.receivedById,
      isRecurring: body.isRecurring || false,
      recurringId: body.recurringId || undefined,
    }

    const income = await incomeService.create(projectId, incomeData)

    return NextResponse.json({ income }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/incomes' })
    return NextResponse.json({ error: 'خطا در ثبت درآمد' }, { status: 500 })
  }
}
