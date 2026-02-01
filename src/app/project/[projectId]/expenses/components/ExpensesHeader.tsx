'use client'

import { formatMoney } from '@/lib/utils/money'

interface ExpensesHeaderProps {
  totalAmount: number
  currency: string
  itemCount: number
  isFiltered: boolean
  /** User's total share across all expenses (optional) */
  myTotalShare?: number
  /** Amount that is unsettled (user owes but hasn't settled) */
  unsettledAmount?: number
  onBack: () => void
}

/**
 * Header component for expenses page - Enhanced with user insights
 *
 * UX Intent:
 * - Calm, informative gradient using building tokens
 * - Total amount present but not visually dominant
 * - Secondary line shows personalized info: "Your share" or "Unsettled amount"
 * - Helper text reduces financial pressure
 * - Soft warning tones, not alarming
 */
export function ExpensesHeader({
  totalAmount,
  currency,
  itemCount,
  isFiltered,
  myTotalShare,
  unsettledAmount,
  onBack,
}: ExpensesHeaderProps) {
  // Determine secondary info to show
  const getSecondaryInfo = () => {
    if (unsettledAmount && unsettledAmount > 0) {
      return {
        label: 'در انتظار تسویه',
        amount: unsettledAmount,
        color: 'text-orange-200',
      }
    }
    if (myTotalShare && myTotalShare > 0) {
      return {
        label: 'سهم تو تا الان',
        amount: myTotalShare,
        color: 'text-white/70',
      }
    }
    return null
  }

  const secondaryInfo = getSecondaryInfo()
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

        {/* Total Summary Card - Enhanced with user share info */}
        <div
          className="rounded-xl p-3.5"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
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

          {/* Secondary Info - User share or unsettled amount */}
          {secondaryInfo && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className={`text-xs ${secondaryInfo.color}`}>
                  {secondaryInfo.label}
                </p>
                <p className={`text-sm font-semibold ${secondaryInfo.color}`}>
                  {formatMoney(secondaryInfo.amount, currency)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
