'use client'

import { useMemo } from 'react'
import { ExpenseItem } from './ExpenseItem'
import { DateSeparator } from './DateSeparator'
import { EmptyState } from './EmptyState'
import {
  calculateHeavyExpenseThreshold,
  type Expense as AnalyticsExpense,
} from '@/lib/utils/expense-analytics'

interface ExpenseShare {
  participantId: string
  amount: number
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  title: string
  amount: number
  expenseDate: string
  periodKey?: string | null
  paidBy: {
    id: string
    name: string
  }
  paidById: string
  categoryId?: string | null
  category?: {
    name: string
    icon: string
    color: string
  } | null
  shares?: ExpenseShare[]
}

// Minimal expense data for quick edit callback
interface QuickEditExpenseData {
  id: string
  title: string
  amount: number
  paidById: string
  categoryId?: string | null
}

interface ExpensesListProps {
  expenses: Expense[]
  groupedExpenses: Record<string, Expense[]>
  projectId: string
  currency: string
  isFiltered: boolean
  onClearFilters: () => void
  showPeriod?: boolean
  myParticipantId?: string | null
  onExpenseClick?: (expenseId: string) => void
  onQuickEdit?: (expense: QuickEditExpenseData) => void
  onAmountUpdate?: (expenseId: string, newAmount: number) => Promise<boolean>
  onCategoryUpdate?: (expenseId: string, newCategoryId: string | null) => Promise<boolean>
  categories?: Category[]
  onAddCategory?: () => void
}

/**
 * Timeline list of expenses grouped by date - Enhanced with user share
 *
 * UX Intent:
 * - Breathable spacing, not dense
 * - Comfortable to scroll and scan
 * - Identify high-cost expenses for visual indicators
 * - Shows user's share for each expense
 * - Sticky date headers for better navigation
 */
export function ExpensesList({
  expenses,
  groupedExpenses,
  projectId,
  currency,
  isFiltered,
  onClearFilters,
  showPeriod = false,
  myParticipantId,
  onExpenseClick,
  onQuickEdit,
  onAmountUpdate,
  onCategoryUpdate,
  categories = [],
  onAddCategory,
}: ExpensesListProps) {
  // Calculate high-cost threshold (top 20% of expenses) - using analytics utility
  const highCostThreshold = useMemo(() => {
    return calculateHeavyExpenseThreshold(expenses as AnalyticsExpense[])
  }, [expenses])

  if (expenses.length === 0) {
    return <EmptyState isFiltered={isFiltered} onClearFilters={onClearFilters} />
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
        <div key={date} className="space-y-2.5">
          {/* Sticky date header for better navigation */}
          <DateSeparator date={date} sticky />

          {/* Cards with improved spacing, indicators, and user share */}
          <div className="space-y-3">
            {dateExpenses.map((expense) => {
              // Find user's share for this expense
              const myShare = expense.shares?.find((s) => s.participantId === myParticipantId)?.amount || 0
              const isUserPayer = expense.paidById === myParticipantId

              return (
                <ExpenseItem
                  key={expense.id}
                  id={expense.id}
                  projectId={projectId}
                  title={expense.title}
                  amount={expense.amount}
                  currency={currency}
                  payer={expense.paidBy}
                  category={expense.category}
                  categoryId={expense.categoryId}
                  periodKey={expense.periodKey}
                  showPeriod={showPeriod}
                  isHighCost={expense.amount >= highCostThreshold}
                  myShare={myShare}
                  isSettled={true} // Future feature: compute settlement status
                  myParticipantId={myParticipantId}
                  onClick={onExpenseClick ? () => onExpenseClick(expense.id) : undefined}
                  onQuickEdit={onQuickEdit ? () => onQuickEdit(expense) : undefined}
                  onAmountUpdate={onAmountUpdate}
                  onCategoryUpdate={onCategoryUpdate}
                  categories={categories}
                  onAddCategory={onAddCategory}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
