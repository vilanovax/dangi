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
 *
 * UX Intent:
 * - Calm blue gradient, informational not intimidating
 * - Total amount present but not visually dominant
 * - Helper text reduces financial pressure
 */
export function ExpensesHeader({
  totalAmount,
  currency,
  itemCount,
  isFiltered,
  onBack,
}: ExpensesHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 pt-4 pb-5">
      {/* Navigation & Title */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onBack}
          className="p-2 -mr-2 hover:bg-white/10 rounded-xl transition-colors active:scale-95"
          aria-label="بازگشت"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">خرج‌ها</h1>
          <p className="text-blue-100 text-sm">{itemCount} مورد</p>
        </div>
      </div>

      {/* Total Summary Card - present but not dominant */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100/80 text-xs mb-0.5">
              {isFiltered ? 'جمع فیلتر شده' : 'جمع خرج‌ها'}
            </p>
            <p className="text-xl font-semibold tracking-tight">
              {formatMoney(totalAmount, currency)}
            </p>
          </div>
          <p className="text-blue-200/70 text-[10px]">تا این لحظه</p>
        </div>
      </div>
    </div>
  )
}
