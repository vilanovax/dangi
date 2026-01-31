'use client'

import { useMemo } from 'react'
import { ExpenseItem } from './ExpenseItem'
import { DateSeparator } from './DateSeparator'
import { EmptyState } from './EmptyState'

interface Expense {
  id: string
  title: string
  amount: number
  expenseDate: string
  periodKey?: string | null
  paidBy: {
    name: string
  }
  category?: {
    name: string
    icon: string
    color: string
  } | null
}

interface ExpensesListProps {
  expenses: Expense[]
  groupedExpenses: Record<string, Expense[]>
  projectId: string
  currency: string
  isFiltered: boolean
  onClearFilters: () => void
  showPeriod?: boolean
  onExpenseClick?: (expenseId: string) => void
}

/**
 * Timeline list of expenses grouped by date - Final Polish
 *
 * UX Intent:
 * - Breathable spacing, not dense
 * - Comfortable to scroll and scan
 * - Identify high-cost expenses for visual indicators
 */
export function ExpensesList({
  expenses,
  groupedExpenses,
  projectId,
  currency,
  isFiltered,
  onClearFilters,
  showPeriod = false,
  onExpenseClick,
}: ExpensesListProps) {
  // Calculate high-cost threshold (top 25% of expenses)
  const highCostThreshold = useMemo(() => {
    if (expenses.length === 0) return 0
    const amounts = expenses.map(e => e.amount).sort((a, b) => b - a)
    const top25Index = Math.floor(amounts.length * 0.25)
    return amounts[top25Index] || 0
  }, [expenses])

  if (expenses.length === 0) {
    return <EmptyState isFiltered={isFiltered} onClearFilters={onClearFilters} />
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
        <div key={date} className="space-y-2.5">
          <DateSeparator date={date} />

          {/* Cards with improved spacing and indicators */}
          <div className="space-y-3">
            {dateExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                id={expense.id}
                projectId={projectId}
                title={expense.title}
                amount={expense.amount}
                currency={currency}
                payer={expense.paidBy}
                category={expense.category}
                periodKey={expense.periodKey}
                showPeriod={showPeriod}
                isHighCost={expense.amount >= highCostThreshold}
                onClick={onExpenseClick ? () => onExpenseClick(expense.id) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
