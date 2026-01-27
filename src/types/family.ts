/**
 * Family Finance Template Types
 * Type definitions for Income, Budget, Recurring Transactions
 */

import type { Prisma } from '@prisma/client'

// ═══════════════════════════════════════════════════════════════
// INCOME TYPES
// ═══════════════════════════════════════════════════════════════

export type Income = Prisma.IncomeGetPayload<{
  include: {
    receivedBy: true
    category: true
  }
}>

export type IncomeWithDetails = Prisma.IncomeGetPayload<{
  include: {
    receivedBy: {
      select: {
        id: true
        name: true
        avatar: true
      }
    }
    category: true
    project: {
      select: {
        id: true
        name: true
        currency: true
      }
    }
  }
}>

export type CreateIncomeInput = {
  title: string
  amount: number
  description?: string
  source?: string
  incomeDate?: Date | string
  categoryId?: string
  receivedById: string
  isRecurring?: boolean
  recurringId?: string
}

export type UpdateIncomeInput = Partial<CreateIncomeInput>

// ═══════════════════════════════════════════════════════════════
// INCOME CATEGORY TYPES
// ═══════════════════════════════════════════════════════════════

export type IncomeCategory = Prisma.IncomeCategoryGetPayload<object>

export type IncomeCategoryWithIncomes = Prisma.IncomeCategoryGetPayload<{
  include: {
    incomes: true
  }
}>

export type CreateIncomeCategoryInput = {
  name: string
  icon?: string
  color?: string
}

export type UpdateIncomeCategoryInput = Partial<CreateIncomeCategoryInput>

// ═══════════════════════════════════════════════════════════════
// BUDGET TYPES
// ═══════════════════════════════════════════════════════════════

export type Budget = Prisma.BudgetGetPayload<{
  include: {
    category: true
  }
}>

export type BudgetWithSpending = Budget & {
  spent: number // محاسبه شده از expenses
  remaining: number // amount - spent
  percentage: number // (spent / amount) * 100
  isOverBudget: boolean // spent > amount
}

export type CreateBudgetInput = {
  categoryId: string
  amount: number
  periodKey: string // "1403-10" format
}

export type UpdateBudgetInput = {
  amount?: number
}

export type BudgetPeriod = {
  year: number // سال شمسی
  month: number // ماه شمسی (1-12)
  key: string // "1403-10"
  startDate: Date
  endDate: Date
}

// ═══════════════════════════════════════════════════════════════
// RECURRING TRANSACTION TYPES
// ═══════════════════════════════════════════════════════════════

export type RecurringTransactionType = 'INCOME' | 'EXPENSE'
export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export type RecurringTransaction = Prisma.RecurringTransactionGetPayload<{
  include: {
    participant: true
    category: true
  }
}>

export type RecurringTransactionWithDetails = Prisma.RecurringTransactionGetPayload<{
  include: {
    participant: {
      select: {
        id: true
        name: true
        avatar: true
      }
    }
    category: true
    project: {
      select: {
        id: true
        name: true
        currency: true
      }
    }
  }
}>

export type CreateRecurringTransactionInput = {
  type: RecurringTransactionType
  title: string
  amount: number
  frequency: RecurringFrequency
  startDate: Date | string
  endDate?: Date | string | null
  categoryId?: string
  participantId: string
  isActive?: boolean
}

export type UpdateRecurringTransactionInput = Partial<
  Omit<CreateRecurringTransactionInput, 'type'>
>

// ═══════════════════════════════════════════════════════════════
// FAMILY DASHBOARD STATS TYPES
// ═══════════════════════════════════════════════════════════════

export type CategoryBudgetStatus = {
  categoryId: string
  categoryName: string
  categoryIcon?: string
  categoryColor?: string
  budgetAmount: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

export type FamilyDashboardStats = {
  // Financial Summary
  totalIncome: number
  totalExpenses: number
  netSavings: number // totalIncome - totalExpenses
  savingsRate: number // (netSavings / totalIncome) * 100

  // Budget Status
  budgets: CategoryBudgetStatus[]
  totalBudget: number
  totalSpent: number
  budgetUtilization: number // (totalSpent / totalBudget) * 100

  // Top Expenses (برترین خرج‌ها)
  topExpenses: Array<{
    categoryName: string
    categoryIcon?: string
    amount: number
    percentage: number // از کل expenses
  }>

  // Recent Transactions
  recentIncomes: Array<{
    id: string
    title: string
    amount: number
    date: Date
    categoryName?: string
    categoryIcon?: string
    receivedByName: string
  }>
  recentExpenses: Array<{
    id: string
    title: string
    amount: number
    date: Date
    categoryName?: string
    categoryIcon?: string
    paidByName: string
  }>

  // Period Info
  periodKey: string // "1403-10"
  periodStartDate: Date
  periodEndDate: Date
}

// ═══════════════════════════════════════════════════════════════
// CASH FLOW TYPES (برای visualizations)
// ═══════════════════════════════════════════════════════════════

export type DailyCashFlow = {
  date: Date
  day: number // روز ماه
  income: number
  expense: number
  net: number // income - expense
  cumulativeNet: number // مجموع تا این روز
}

export type MonthlyCashFlowData = {
  periodKey: string
  days: DailyCashFlow[]
  totalIncome: number
  totalExpense: number
  netCashFlow: number
}

// ═══════════════════════════════════════════════════════════════
// FILTER & QUERY TYPES
// ═══════════════════════════════════════════════════════════════

export type IncomeFilterParams = {
  startDate?: Date | string
  endDate?: Date | string
  categoryId?: string
  receivedById?: string
  source?: string
  search?: string
}

export type TransactionType = 'ALL' | 'INCOME' | 'EXPENSE'

export type TransactionFilterParams = {
  type?: TransactionType
  startDate?: Date | string
  endDate?: Date | string
  categoryId?: string
  participantId?: string
  search?: string
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ═══════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════

export type PeriodComparison = {
  currentPeriod: {
    key: string
    totalIncome: number
    totalExpenses: number
    netSavings: number
  }
  previousPeriod: {
    key: string
    totalIncome: number
    totalExpenses: number
    netSavings: number
  }
  changes: {
    incomeChange: number // percentage
    expenseChange: number // percentage
    savingsChange: number // percentage
  }
}
