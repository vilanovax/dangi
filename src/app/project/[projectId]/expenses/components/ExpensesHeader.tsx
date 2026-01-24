'use client'

import { UnifiedHeader, HeaderSummaryCard } from '@/components/layout'

interface ExpensesHeaderProps {
  totalAmount: number
  currency: string
  itemCount: number
  isFiltered: boolean
  onBack: () => void
}

/**
 * Header component for expenses page - uses UnifiedHeader with variant="action"
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
    <UnifiedHeader
      variant="action"
      tone="default"
      title="خرج‌ها"
      subtitle={`${itemCount} مورد`}
      showBack
      onBack={onBack}
    >
      {/* Total Summary Card - present but not dominant */}
      <HeaderSummaryCard
        label="جمع خرج‌ها"
        amount={totalAmount}
        currency={currency}
        helperText="تا این لحظه"
        isFiltered={isFiltered}
      />
    </UnifiedHeader>
  )
}
