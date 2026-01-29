/**
 * Family Dashboard Stats API
 * GET /api/projects/[projectId]/family-stats?period=1403-10
 * Returns comprehensive financial stats for family dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/services/project.service'
import { incomeService } from '@/lib/services/income.service'
import { budgetService } from '@/lib/services/budget.service'
import { prisma } from '@/lib/db/prisma'
import { getCurrentPeriod, parsePeriodKey } from '@/lib/utils/jalali'
import type { FamilyDashboardStats, CategoryBudgetStatus } from '@/types/family'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params
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
    const { startDate, endDate } = periodDates

    // Get total income for period
    const totalIncome = await incomeService.getTotalForPeriod(
      projectId,
      startDate,
      endDate
    )

    // Get total expenses for period
    const expensesSum = await prisma.expense.aggregate({
      where: {
        projectId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })
    const totalExpenses = expensesSum._sum.amount || 0

    // Calculate net savings
    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

    // Get budgets with spending
    const budgetsWithSpending = await budgetService.getBudgetsWithSpending(
      projectId,
      periodKey,
      startDate,
      endDate
    )

    const budgets: CategoryBudgetStatus[] = budgetsWithSpending.map((b) => ({
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryIcon: b.category.icon || undefined,
      categoryColor: b.category.color || undefined,
      budgetAmount: b.amount,
      spent: b.spent,
      remaining: b.remaining,
      percentage: b.percentage,
      isOverBudget: b.isOverBudget,
    }))

    // Get budget totals
    const budgetTotals = await budgetService.getTotalsForPeriod(
      projectId,
      periodKey,
      startDate,
      endDate
    )

    // Get top expenses by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        projectId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 5,
    })

    const topExpenses = await Promise.all(
      expensesByCategory.map(async (item) => {
        const category = item.categoryId
          ? await prisma.category.findUnique({
              where: { id: item.categoryId },
            })
          : null

        const amount = item._sum.amount || 0
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0

        return {
          categoryName: category?.name || 'بدون دسته‌بندی',
          categoryIcon: category?.icon,
          amount,
          percentage: Math.round(percentage * 100) / 100,
        }
      })
    )

    // Get recent incomes
    const recentIncomes = await incomeService.getRecent(projectId, 5)
    const recentIncomesData = recentIncomes.map((income) => ({
      id: income.id,
      title: income.title,
      amount: income.amount,
      date: income.incomeDate,
      categoryName: income.category?.name,
      categoryIcon: income.category?.icon,
      receivedByName: income.receivedBy.name,
    }))

    // Get recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: { projectId },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
      orderBy: { expenseDate: 'desc' },
      take: 5,
    })

    const recentExpensesData = recentExpenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.expenseDate,
      categoryName: expense.category?.name,
      categoryIcon: expense.category?.icon,
      paidByName: expense.paidBy.name,
    }))

    const stats: FamilyDashboardStats = {
      // Financial Summary
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate: Math.round(savingsRate * 100) / 100,

      // Budget Status
      budgets,
      totalBudget: budgetTotals.totalBudget,
      totalSpent: budgetTotals.totalSpent,
      budgetUtilization: budgetTotals.budgetUtilization,

      // Top Expenses
      topExpenses,

      // Recent Transactions
      recentIncomes: recentIncomesData,
      recentExpenses: recentExpensesData,

      // Period Info
      periodKey,
      periodStartDate: startDate,
      periodEndDate: endDate,
    }

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Error fetching family stats:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت آمار', details: error.message },
      { status: 500 }
    )
  }
}
