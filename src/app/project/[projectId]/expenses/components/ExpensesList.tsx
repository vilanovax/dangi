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
 * Clean, scrollable, comfortable to browse
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
    <div className="px-4 py-4 space-y-4">
      {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
        <div key={date} className="space-y-2">
          <DateSeparator date={date} />

          <div className="space-y-2">
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
