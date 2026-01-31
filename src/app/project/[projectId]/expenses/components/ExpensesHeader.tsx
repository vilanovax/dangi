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
 * Header component for expenses page - uses building design tokens
 *
 * UX Intent:
 * - Calm, informative gradient using building tokens
 * - Total amount present but not visually dominant
 * - Helper text reduces financial pressure
 * - Soft warning tones, not alarming
 */
export function ExpensesHeader({
  totalAmount,
  currency,
  itemCount,
  isFiltered,
  onBack,
}: ExpensesHeaderProps) {
  return (
    <header className="sticky top-0 z-10">
      {/* Calm gradient background using building tokens */}
      <div
        className="px-4 pt-4 pb-5"
        style={{
          background: 'linear-gradient(135deg, var(--building-primary) 0%, var(--building-success) 100%)',
        }}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-2 -mr-2 rounded-xl transition-all active:scale-95 text-white hover:bg-white/10"
            aria-label="بازگشت"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-white">خرج‌ها</h1>
            <p className="text-xs text-white/80">{itemCount} مورد</p>
          </div>

          {/* Spacer for alignment */}
          <div className="w-9" />
        </div>

        {/* Total Summary Card - Softer, informative */}
        <div
          className="rounded-xl p-3.5"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs mb-1">
                {isFiltered ? 'جمع فیلتر شده' : 'جمع خرج‌ها'}
              </p>
              <p className="text-2xl font-bold text-white tracking-tight">
                {formatMoney(totalAmount, currency)}
              </p>
            </div>
            <div className="text-left">
              <p className="text-white/60 text-[10px]">تا این لحظه</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
