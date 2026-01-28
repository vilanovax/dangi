import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { calculateFamilyStats } from '@/lib/domain/calculators/familyStats'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import {
  getCurrentPeriodKey,
  getPersianPeriodBounds,
} from '@/lib/utils/persian-date'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/family-stats - Get family finance dashboard stats
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

    // Get period from query params (optional, defaults to current month)
    const { searchParams } = new URL(request.url)
    const periodKey = searchParams.get('period') || getCurrentPeriodKey()

    // Calculate period dates (convert Persian to Gregorian)
    const { startDate, endDate } = getPersianPeriodBounds(periodKey)

    // Fetch dashboard data
    const stats = await calculateFamilyStats(projectId, periodKey, startDate, endDate)

    // Transform budgets data to match the format expected by BudgetsPage
    const budgetsFormatted = stats.budgets.map((budget) => ({
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      categoryIcon: budget.categoryIcon,
      spent: budget.spent / 10, // Convert to Toman
      limit: budget.budgetAmount / 10, // Convert to Toman
      percentage: budget.percentage,
    }))

    return NextResponse.json({
      // Budget data
      budgets: budgetsFormatted,
      totalBudget: stats.totalBudget / 10, // Convert to Toman
      totalSpent: stats.totalSpent / 10, // Convert to Toman
      budgetUtilization: stats.budgetUtilization,

      // Income and expense data
      totalIncome: stats.totalIncome / 10,
      totalExpenses: stats.totalExpenses / 10,
      netSavings: stats.netSavings / 10,
      savingsRate: stats.savingsRate,

      // Top expenses
      topExpenses: stats.topExpenses.map((expense) => ({
        ...expense,
        amount: expense.amount / 10,
      })),

      // Recent transactions
      recentIncomes: stats.recentIncomes.map((income) => ({
        ...income,
        amount: income.amount / 10,
      })),
      recentExpenses: stats.recentExpenses.map((expense) => ({
        ...expense,
        amount: expense.amount / 10,
      })),

      // Period info
      periodKey: stats.periodKey,
      periodStartDate: stats.periodStartDate,
      periodEndDate: stats.periodEndDate,
    })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/family-stats' })
    return NextResponse.json(
      { error: 'خطا در دریافت آمار مالی خانواده' },
      { status: 500 }
    )
  }
}
