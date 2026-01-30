'use client'

import { familyTheme } from '@/styles/family-theme'

interface BudgetProgressBarProps {
  categoryName: string
  categoryIcon?: string
  spent: number
  limit: number
  currency: string
  isOverBudget: boolean
}

export function BudgetProgressBar({
  categoryName,
  categoryIcon,
  spent,
  limit,
  currency,
  isOverBudget,
}: BudgetProgressBarProps) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0

  // Color logic: green → yellow → red
  let barColor: string = familyTheme.colors.success // green (under 70%)
  if (percentage >= 90) {
    barColor = familyTheme.colors.danger // red (over 90%)
  } else if (percentage >= 70) {
    barColor = familyTheme.colors.warning // yellow (70-90%)
  }

  return (
    <div className="py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {categoryIcon && <span className="text-lg">{categoryIcon}</span>}
          <span
            className="font-medium"
            style={{
              fontSize: familyTheme.typography.body.size,
              color: familyTheme.colors.textPrimary
            }}
          >
            {categoryName}
          </span>
        </div>
        <div
          style={{
            fontSize: familyTheme.typography.small.size,
            color: familyTheme.colors.textSecondary
          }}
        >
          {spent.toLocaleString('fa-IR')} / {limit.toLocaleString('fa-IR')}{' '}
          {currency}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: familyTheme.colors.divider }}
      >
        <div
          className="absolute top-0 right-0 h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {/* Status text */}
      {isOverBudget && (
        <div
          className="mt-1"
          style={{
            fontSize: familyTheme.typography.small.size,
            color: familyTheme.colors.danger
          }}
        >
          {(spent - limit).toLocaleString('fa-IR')} {currency} بیش از بودجه
        </div>
      )}
    </div>
  )
}
