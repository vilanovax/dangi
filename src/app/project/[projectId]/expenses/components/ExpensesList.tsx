'use client'

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
}

/**
 * Timeline list of expenses grouped by date
 *
 * UX Intent:
 * - Breathable spacing, not dense
 * - Comfortable to scroll and scan
 * - Extra top padding for visual separation from search
 */
export function ExpensesList({
  expenses,
  groupedExpenses,
  projectId,
  currency,
  isFiltered,
  onClearFilters,
  showPeriod = false,
}: ExpensesListProps) {
  if (expenses.length === 0) {
    return <EmptyState isFiltered={isFiltered} onClearFilters={onClearFilters} />
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
        <div key={date} className="space-y-2.5">
          <DateSeparator date={date} />

          {/* Cards with slightly more spacing for better rhythm */}
          <div className="space-y-2.5">
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
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
