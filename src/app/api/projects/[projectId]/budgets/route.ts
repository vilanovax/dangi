/**
 * Budget API Routes
 * GET /api/projects/[projectId]/budgets?period=1403-10 - List budgets for a period
 * POST /api/projects/[projectId]/budgets - Create or update budget
 */

import { NextRequest, NextResponse } from 'next/server'
import { budgetService } from '@/lib/services/budget.service'
import { projectService } from '@/lib/services/project.service'
import type { CreateBudgetInput } from '@/types/family'
import { getCurrentPeriod, parsePeriodKey } from '@/lib/utils/jalali'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const periodKey = searchParams.get('period') || getCurrentPeriod()

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

    // Parse period to get date range
    const periodDates = parsePeriodKey(periodKey)
    
    // Get budgets with spending data
    const budgets = await budgetService.getBudgetsWithSpending(
      projectId,
      periodKey,
      periodDates.startDate,
      periodDates.endDate
    )

    // Get totals
    const totals = await budgetService.getTotalsForPeriod(
      projectId,
      periodKey,
      periodDates.startDate,
      periodDates.endDate
    )

    return NextResponse.json({
      budgets,
      totals,
      periodKey,
      periodStart: periodDates.startDate,
      periodEnd: periodDates.endDate,
    })
  } catch (error: any) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت بودجه‌ها', details: error.message },
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

    // Handle bulk upsert if budgets array is provided
    if (body.budgets && Array.isArray(body.budgets)) {
      const periodKey = body.periodKey || getCurrentPeriod()
      
      // Validate bulk budgets
      for (const budget of body.budgets) {
        if (!budget.categoryId || !budget.amount) {
          return NextResponse.json(
            { error: 'هر بودجه باید شامل categoryId و amount باشد' },
            { status: 400 }
          )
        }
        if (budget.amount < 0) {
          return NextResponse.json(
            { error: 'مبلغ بودجه نمی‌تواند منفی باشد' },
            { status: 400 }
          )
        }
      }

      const budgets = await budgetService.bulkUpsert(
        projectId,
        periodKey,
        body.budgets
      )

      return NextResponse.json({
        message: 'بودجه‌ها با موفقیت تنظیم شدند',
        budgets,
        count: budgets.length,
      })
    }

    // Single budget upsert
    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'انتخاب دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    if (body.amount === undefined || body.amount < 0) {
      return NextResponse.json(
        { error: 'مبلغ بودجه باید بزرگتر یا مساوی صفر باشد' },
        { status: 400 }
      )
    }

    if (!body.periodKey) {
      return NextResponse.json(
        { error: 'دوره زمانی الزامی است' },
        { status: 400 }
      )
    }

    // Verify category exists
    const category = await projectService.getCategory(projectId, body.categoryId)
    if (!category) {
      return NextResponse.json(
        { error: 'دسته‌بندی در این پروژه وجود ندارد' },
        { status: 404 }
      )
    }

    const budgetData: CreateBudgetInput = {
      categoryId: body.categoryId,
      amount: parseFloat(body.amount),
      periodKey: body.periodKey,
    }

    const budget = await budgetService.upsert(projectId, budgetData)

    return NextResponse.json({
      message: 'بودجه با موفقیت تنظیم شد',
      budget,
    })
  } catch (error: any) {
    console.error('Error creating/updating budget:', error)
    return NextResponse.json(
      { error: 'خطا در تنظیم بودجه', details: error.message },
      { status: 500 }
    )
  }
}
