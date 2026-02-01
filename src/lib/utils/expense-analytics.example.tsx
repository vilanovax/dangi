/**
 * Heavy Expenses Filter - Usage Examples
 *
 * This file demonstrates how to use the heavy expenses utilities
 * in React components with proper memoization.
 */

import { useMemo } from 'react'
import {
  getHeavyExpenses,
  calculateHeavyExpenseThreshold,
  countHeavyExpenses,
  type Expense,
  type HeavyExpensesResult,
} from './expense-analytics'

// ============================================
// Example 1: Basic Usage with Full Result
// ============================================

interface ExpenseListProps {
  expenses: Expense[]
}

export function ExpenseListWithHeavyFilter({ expenses }: ExpenseListProps) {
  // Memoize heavy expenses calculation - only recalculates when expenses change
  const heavyResult: HeavyExpensesResult = useMemo(() => {
    return getHeavyExpenses(expenses)
  }, [expenses])

  const { heavyExpenses, meta } = heavyResult

  return (
    <div>
      {/* Show metadata */}
      <div className="mb-4 p-4 bg-orange-50 rounded-lg">
        <p className="text-sm font-semibold">خرج‌های سنگین (بالای ۲۰٪)</p>
        <p className="text-xs text-gray-600">
          {meta.count} مورد • {meta.percentageOfTotalSpend}٪ از کل هزینه‌ها
        </p>
      </div>

      {/* Render heavy expenses */}
      <div className="space-y-2">
        {heavyExpenses.map((expense) => (
          <div key={expense.id} className="p-3 bg-white rounded-lg border-l-4 border-orange-500">
            <p className="font-semibold">{expense.amount.toLocaleString('fa-IR')} تومان</p>
            <p className="text-sm text-gray-600">خرج سنگین</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Example 2: Filter Chip (Minimal API)
// ============================================

export function HeavyExpenseChip({ expenses }: ExpenseListProps) {
  // Only need count - use the lightweight helper
  const heavyCount = useMemo(() => {
    return countHeavyExpenses(expenses)
  }, [expenses])

  if (heavyCount === 0) return null

  return (
    <button className="px-3 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
      💰 خرج‌های سنگین ({heavyCount})
    </button>
  )
}

// ============================================
// Example 3: Highlight Heavy Expenses in List
// ============================================

export function ExpenseItemWithHighlight({
  expense,
  expenses,
}: {
  expense: Expense
  expenses: Expense[]
}) {
  // Calculate threshold once for entire list (parent should memoize this)
  const threshold = useMemo(() => {
    return calculateHeavyExpenseThreshold(expenses)
  }, [expenses])

  const isHeavy = expense.amount >= threshold

  return (
    <div className={`p-3 rounded-lg ${isHeavy ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{expense.amount.toLocaleString('fa-IR')} تومان</span>
        {isHeavy && (
          <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">
            سنگین
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// Example 4: Smart Filter Tabs UI
// ============================================

type FilterMode = 'all' | 'heavy'

export function ExpenseListWithTabs({ expenses }: ExpenseListProps) {
  const [filter, setFilter] = React.useState<FilterMode>('all')

  // Pre-calculate heavy expenses (memoized)
  const { heavyExpenses, meta } = useMemo(() => getHeavyExpenses(expenses), [expenses])

  // Select which list to show based on filter
  const displayedExpenses = filter === 'heavy' ? heavyExpenses : expenses

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'
          }`}
        >
          همه ({expenses.length})
        </button>
        <button
          onClick={() => setFilter('heavy')}
          className={`px-4 py-2 rounded-full ${
            filter === 'heavy' ? 'bg-orange-500 text-white' : 'bg-gray-100'
          }`}
        >
          💰 خرج‌های سنگین ({meta.count})
        </button>
      </div>

      {/* Insight Banner (only show when heavy filter is active) */}
      {filter === 'heavy' && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800">
            این {meta.count} خرج معادل <strong>{meta.percentageOfTotalSpend}٪</strong> کل هزینه‌ها
            رو شامل می‌شه
          </p>
        </div>
      )}

      {/* Expense List */}
      <div className="space-y-2">
        {displayedExpenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">هیچ خرجی وجود نداره</p>
        ) : (
          displayedExpenses.map((expense) => (
            <div key={expense.id} className="p-3 bg-white rounded-lg">
              {expense.amount.toLocaleString('fa-IR')} تومان
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================
// Performance Notes
// ============================================

/*
MEMOIZATION BEST PRACTICES:

1. ALWAYS use useMemo when calling expense analytics functions:
   ✅ const result = useMemo(() => getHeavyExpenses(expenses), [expenses])
   ❌ const result = getHeavyExpenses(expenses) // Recalculates on every render!

2. Threshold-based checks are cheaper than full list computation:
   - Need count only? → Use countHeavyExpenses()
   - Need threshold for comparisons? → Use calculateHeavyExpenseThreshold()
   - Need actual expense list? → Use getHeavyExpenses()

3. If passing threshold down to child components, memoize at parent level:
   const threshold = useMemo(() => calculateHeavyExpenseThreshold(expenses), [expenses])
   // Then pass threshold to children (won't recalculate in each child)

4. Sorting is O(n log n), filtering is O(n):
   - These functions are fast for typical expense lists (< 1000 items)
   - For very large lists, consider server-side filtering

EDGE CASE HANDLING:

✅ Empty list → Returns empty array (no errors)
✅ 1 expense → That expense is considered heavy
✅ Equal amounts at cutoff → ALL are included (fair grouping)
✅ Round up (Math.ceil) → User sees meaningful results even for small lists

UX INTENT:

Top 20% = High-impact spending focus
- User wants to know: "کجا بیشترین پول خرج شده؟"
- NOT a detailed analytics dashboard
- Quick decision-making tool
- Creates sense of control over spending

The chip UI pattern:
[ همه ] [ خرج‌های سنگین ] [ غذا ] [ حمل‌ونقل ]

When "خرج‌های سنگین" is active:
✅ List gets shorter
✅ Decision-making becomes faster
✅ User feels more in control
*/
