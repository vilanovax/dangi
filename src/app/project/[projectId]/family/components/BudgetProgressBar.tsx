'use client'

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
  let barColor = '#4ADE80' // green (under 70%)
  if (percentage >= 90) {
    barColor = '#FF6B6B' // red (over 90%)
  } else if (percentage >= 70) {
    barColor = '#FCD34D' // yellow (70-90%)
  }

  return (
    <div className="py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {categoryIcon && <span className="text-lg">{categoryIcon}</span>}
          <span className="text-sm font-medium text-stone-800">
            {categoryName}
          </span>
        </div>
        <div className="text-xs text-stone-600">
          {spent.toLocaleString('fa-IR')} / {limit.toLocaleString('fa-IR')}{' '}
          {currency}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-amber-100 rounded-full overflow-hidden">
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
        <div className="text-xs text-red-600 mt-1">
          {(spent - limit).toLocaleString('fa-IR')} {currency} بیش از بودجه
        </div>
      )}
    </div>
  )
}
