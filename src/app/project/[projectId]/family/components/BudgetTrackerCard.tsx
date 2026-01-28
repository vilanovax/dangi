'use client'

import { BudgetProgressBar } from './BudgetProgressBar'
import type { CategoryBudgetStatus } from '@/types/family'
import { familyTheme } from '@/styles/family-theme'

interface BudgetTrackerCardProps {
  budgets: CategoryBudgetStatus[]
  totalBudget: number
  totalSpent: number
  budgetUtilization: number
  currency: string
}

export function BudgetTrackerCard({
  budgets,
  totalBudget,
  totalSpent,
  budgetUtilization,
  currency,
}: BudgetTrackerCardProps) {
  const overBudgetCount = budgets.filter((b) => b.isOverBudget).length

  return (
    <div
      className="h-screen w-full flex flex-col p-6 snap-start overflow-y-auto"
      style={{ backgroundColor: familyTheme.colors.background }}
    >
      {/* Header */}
      <div className="text-center mb-6 pt-6">
        <h2
          className="font-bold mb-2"
          style={{
            fontSize: '28px',
            fontWeight: familyTheme.typography.pageTitle.weight,
            color: familyTheme.colors.textPrimary
          }}
        >
          پیگیری بودجه
        </h2>
        <p
          style={{
            fontSize: familyTheme.typography.body.size,
            color: familyTheme.colors.textSecondary
          }}
        >
          {budgets.length} دسته‌بندی
          {overBudgetCount > 0 && (
            <span style={{ color: familyTheme.colors.danger, marginRight: '4px' }}>
              · {overBudgetCount} بیش از حد
            </span>
          )}
        </p>
      </div>

      {/* Overall stats */}
      <div
        className="rounded-3xl p-6 mb-6"
        style={{
          backgroundColor: familyTheme.colors.card,
          boxShadow: familyTheme.card.shadow
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className="mb-1"
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              کل بودجه
            </div>
            <div
              className="font-bold"
              style={{
                fontSize: '24px',
                fontWeight: familyTheme.typography.cardNumber.weight,
                color: familyTheme.colors.textPrimary
              }}
            >
              {totalBudget.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="text-left">
            <div
              className="mb-1"
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              مصرف شده
            </div>
            <div
              className="font-bold"
              style={{
                fontSize: '24px',
                fontWeight: familyTheme.typography.cardNumber.weight,
                color: familyTheme.colors.primary
              }}
            >
              {totalSpent.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: familyTheme.colors.divider }}
        >
          <div
            className="absolute top-0 right-0 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(budgetUtilization, 100)}%`,
              backgroundColor: familyTheme.colors.primary
            }}
          />
        </div>

        <div
          className="text-center mt-2 font-medium"
          style={{
            fontSize: familyTheme.typography.body.size,
            color: familyTheme.colors.textPrimary
          }}
        >
          {budgetUtilization.toFixed(0)}% استفاده شده
        </div>
      </div>

      {/* Budget list */}
      <div className="flex-1 overflow-y-auto">
        {budgets.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow
            }}
          >
            <span className="text-5xl mb-4 block">🎯</span>
            <p
              className="mb-4"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              هنوز بودجه‌ای تنظیم نشده است
            </p>
            <button
              className="text-white px-6 py-2 rounded-full font-medium transition-colors hover:opacity-90"
              style={{
                fontSize: familyTheme.typography.body.size,
                backgroundColor: familyTheme.colors.primary
              }}
            >
              تنظیم بودجه
            </button>
          </div>
        ) : (
          <div
            className="rounded-3xl p-6 divide-y"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow,
              borderColor: familyTheme.colors.divider
            }}
          >
            {budgets.map((budget) => (
              <BudgetProgressBar
                key={budget.categoryId}
                categoryName={budget.categoryName}
                categoryIcon={budget.categoryIcon}
                spent={budget.spent}
                limit={budget.budgetAmount}
                currency={currency}
                isOverBudget={budget.isOverBudget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-6" />
    </div>
  )
}
