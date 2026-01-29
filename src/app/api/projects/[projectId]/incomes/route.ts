/**
 * Income API Routes
 * GET /api/projects/[projectId]/incomes - List all incomes with filters
 * POST /api/projects/[projectId]/incomes - Create a new income
 */

import { NextRequest, NextResponse } from 'next/server'
import { incomeService } from '@/lib/services/income.service'
import { projectService } from '@/lib/services/project.service'
import type { CreateIncomeInput, IncomeFilterParams } from '@/types/family'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(request.url)

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

    // Parse filter parameters
    const filters: IncomeFilterParams = {}

    if (searchParams.get('startDate')) {
      filters.startDate = searchParams.get('startDate')!
    }
    if (searchParams.get('endDate')) {
      filters.endDate = searchParams.get('endDate')!
    }
    if (searchParams.get('categoryId')) {
      filters.categoryId = searchParams.get('categoryId')!
    }
    if (searchParams.get('receivedById')) {
      filters.receivedById = searchParams.get('receivedById')!
    }
    if (searchParams.get('source')) {
      filters.source = searchParams.get('source')!
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    const incomes = await incomeService.getAll(projectId, filters)

    return NextResponse.json({
      incomes,
      count: incomes.length,
    })
  } catch (error: any) {
    console.error('Error fetching incomes:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت لیست درآمدها', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
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
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'عنوان درآمد الزامی است' },
        { status: 400 }
      )
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید بزرگتر از صفر باشد' },
        { status: 400 }
      )
    }

    if (!body.receivedById) {
      return NextResponse.json(
        { error: 'انتخاب دریافت‌کننده الزامی است' },
        { status: 400 }
      )
    }

    // Verify participant exists and belongs to this project
    const participant = await projectService.getParticipant(
      projectId,
      body.receivedById
    )
    if (!participant) {
      return NextResponse.json(
        { error: 'دریافت‌کننده در این پروژه وجود ندارد' },
        { status: 404 }
      )
    }

    const incomeData: CreateIncomeInput = {
      title: body.title.trim(),
      amount: parseFloat(body.amount),
      description: body.description?.trim(),
      source: body.source?.trim(),
      incomeDate: body.incomeDate,
      categoryId: body.categoryId,
      receivedById: body.receivedById,
      isRecurring: body.isRecurring || false,
      recurringId: body.recurringId,
    }

    const income = await incomeService.create(projectId, incomeData)

    return NextResponse.json(
      {
        message: 'درآمد با موفقیت ثبت شد',
        income,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating income:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت درآمد', details: error.message },
      { status: 500 }
    )
  }
}
