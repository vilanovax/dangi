/**
 * Family Finance Statistics Calculator
 * Calculate dashboard stats for family finance template
 */

import { prisma } from '@/lib/db/prisma'
import type {
  FamilyDashboardStats,
  CategoryBudgetStatus,
  DailyCashFlow,
  MonthlyCashFlowData,
} from '@/types/family'
import { incomeService } from '@/lib/services/income.service'
import { budgetService } from '@/lib/services/budget.service'

/**
 * Calculate family dashboard statistics for a given period
 */
export async function calculateFamilyStats(
  projectId: string,
  periodKey: string,
  startDate: Date,
  endDate: Date
): Promise<FamilyDashboardStats> {
  // Get total income and expenses
  const [totalIncome, totalExpenses, budgetsWithSpending, recentIncomesData] =
    await Promise.all([
      incomeService.getTotalForPeriod(projectId, startDate, endDate),
      getExpensesTotal(projectId, startDate, endDate),
      budgetService.getBudgetsWithSpending(projectId, periodKey, startDate, endDate),
      incomeService.getRecent(projectId, 5),
    ])

  // Convert to simple format
  const recentIncomes = recentIncomesData.map((income) => ({
    id: income.id,
    title: income.title,
    amount: income.amount,
    date: income.incomeDate,
    categoryName: income.category?.name,
    categoryIcon: income.category?.icon || undefined,
    receivedByName: income.receivedBy.name,
  }))

  // Calculate net savings
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  // Budget status
  const budgets: CategoryBudgetStatus[] = budgetsWithSpending.map((budget) => ({
    categoryId: budget.category.id,
    categoryName: budget.category.name,
    categoryIcon: budget.category.icon || undefined,
    categoryColor: budget.category.color || undefined,
    budgetAmount: budget.amount,
    spent: budget.spent,
    remaining: budget.remaining,
    percentage: budget.percentage,
    isOverBudget: budget.isOverBudget,
  }))

  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Top expenses by category
  const topExpenses = await getTopExpenseCategories(projectId, startDate, endDate, 5)

  // Recent expenses
  const recentExpenses = await getRecentExpenses(projectId, 10)

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate: Math.round(savingsRate * 100) / 100,
    budgets,
    totalBudget,
    totalSpent,
    budgetUtilization: Math.round(budgetUtilization * 100) / 100,
    topExpenses,
    recentIncomes,
    recentExpenses,
    periodKey,
    periodStartDate: startDate,
    periodEndDate: endDate,
  }
}

/**
 * Get total expenses for a period
 */
async function getExpensesTotal(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.expense.aggregate({
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

  return result._sum.amount || 0
}

/**
 * Get top expense categories
 */
async function getTopExpenseCategories(
  projectId: string,
  startDate: Date,
  endDate: Date,
  limit: number
) {
  const expenses = await prisma.expense.findMany({
    where: {
      projectId,
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
  })

  // Group by category
  const categoryTotals: Record<
    string,
    { name: string; icon?: string; amount: number }
  > = {}

  expenses.forEach((expense) => {
    const categoryName = expense.category?.name || 'سایر'
    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = {
        name: categoryName,
        icon: expense.category?.icon || undefined,
        amount: 0,
      }
    }
    categoryTotals[categoryName].amount += expense.amount
  })

  // Calculate total for percentage
  const totalExpenses = Object.values(categoryTotals).reduce(
    (sum, cat) => sum + cat.amount,
    0
  )

  // Convert to array and add percentage
  const topCategories = Object.values(categoryTotals)
    .map((cat) => ({
      categoryName: cat.name,
      categoryIcon: cat.icon,
      amount: cat.amount,
      percentage:
        totalExpenses > 0
          ? Math.round((cat.amount / totalExpenses) * 100 * 100) / 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)

  return topCategories
}

/**
 * Get recent expenses
 */
async function getRecentExpenses(projectId: string, limit: number) {
  const expenses = await prisma.expense.findMany({
    where: { projectId },
    include: {
      category: true,
      paidBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { expenseDate: 'desc' },
    take: limit,
  })

  return expenses.map((expense) => ({
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    date: expense.expenseDate,
    categoryName: expense.category?.name,
    categoryIcon: expense.category?.icon || undefined,
    paidByName: expense.paidBy.name,
  }))
}

/**
 * Calculate daily cash flow for a month
 */
export async function calculateDailyCashFlow(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyCashFlowData> {
  // Get all incomes and expenses for the period
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: {
        projectId,
        incomeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        incomeDate: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        projectId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        expenseDate: true,
      },
    }),
  ])

  // Group by day
  const dayMap: Record<
    string,
    { income: number; expense: number; date: Date; day: number }
  > = {}

  // Initialize all days in the period
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dayKey = currentDate.toISOString().split('T')[0]
    dayMap[dayKey] = {
      income: 0,
      expense: 0,
      date: new Date(currentDate),
      day: currentDate.getDate(),
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Sum incomes by day
  incomes.forEach((income) => {
    const dayKey = income.incomeDate.toISOString().split('T')[0]
    if (dayMap[dayKey]) {
      dayMap[dayKey].income += income.amount
    }
  })

  // Sum expenses by day
  expenses.forEach((expense) => {
    const dayKey = expense.expenseDate.toISOString().split('T')[0]
    if (dayMap[dayKey]) {
      dayMap[dayKey].expense += expense.amount
    }
  })

  // Convert to array and calculate cumulative
  let cumulativeNet = 0
  const days: DailyCashFlow[] = Object.values(dayMap)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => {
      const net = day.income - day.expense
      cumulativeNet += net
      return {
        date: day.date,
        day: day.day,
        income: day.income,
        expense: day.expense,
        net,
        cumulativeNet,
      }
    })

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Generate periodKey from startDate (format: "YYYY-MM")
  const year = startDate.getFullYear()
  const month = String(startDate.getMonth() + 1).padStart(2, '0')
  const periodKey = `${year}-${month}`

  return {
    periodKey,
    days,
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
  }
}

/**
 * Helper: Parse period key to dates
 * Format: "1403-10" (Persian year-month) or "2024-12" (Gregorian year-month)
 */
export function parsePeriodKey(periodKey: string): {
  startDate: Date
  endDate: Date
} {
  const [yearStr, monthStr] = periodKey.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  // Assume Gregorian for simplicity (can be enhanced for Persian calendar)
  const startDate = new Date(year, month - 1, 1) // First day of month
  const endDate = new Date(year, month, 0) // Last day of month

  return { startDate, endDate }
}
