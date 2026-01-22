'use client'

import { formatMoney } from '@/lib/utils/money'

interface ExpensesHeaderProps {
  totalAmount: number
  currency: string
  itemCount: number
  isFiltered: boolean
  onBack: () => void
}

/**
 * Header component for expenses page
 * Shows page title, count, and total amount summary
 * Uses calm blue gradient - informational, not intimidating
 */
export function ExpensesHeader({
  totalAmount,
  currency,
  itemCount,
  isFiltered,
  onBack,
}: ExpensesHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 pt-4 pb-6">
      {/* Navigation & Title */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 -mr-2 hover:bg-white/10 rounded-xl transition-colors"
          aria-label="بازگشت"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">خرج‌ها</h1>
          <p className="text-blue-100 text-sm">{itemCount} مورد</p>
        </div>
      </div>

      {/* Total Summary Card - calm and informational */}
      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
        <p className="text-blue-100 text-sm mb-1">
          {isFiltered ? 'جمع فیلتر شده' : 'جمع کل خرج‌ها'}
        </p>
        <p className="text-2xl font-bold tracking-tight">
          {formatMoney(totalAmount, currency)}
        </p>
        <p className="text-blue-200 text-xs mt-1">تا این لحظه</p>
      </div>
    </div>
  )
}
