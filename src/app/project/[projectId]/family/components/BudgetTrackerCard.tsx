'use client'

import { BudgetProgressBar } from './BudgetProgressBar'
import type { CategoryBudgetStatus } from '@/types/family'

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
    <div className="h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col p-6 snap-start overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6 pt-6">
        <h2 className="text-3xl font-bold text-stone-800 mb-2">
          پیگیری بودجه
        </h2>
        <p className="text-sm text-stone-600">
          {budgets.length} دسته‌بندی
          {overBudgetCount > 0 && (
            <span className="text-red-600 mr-1">
              · {overBudgetCount} بیش از حد
            </span>
          )}
        </p>
      </div>

      {/* Overall stats */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-stone-600 mb-1">کل بودجه</div>
            <div className="text-2xl font-bold text-stone-800">
              {totalBudget.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs text-stone-600 mb-1">مصرف شده</div>
            <div className="text-2xl font-bold text-amber-600">
              {totalSpent.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="relative h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="absolute top-0 right-0 h-full rounded-full transition-all duration-500 bg-gradient-to-l from-amber-500 to-orange-500"
            style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
          />
        </div>

        <div className="text-center mt-2 text-sm font-medium text-stone-700">
          {budgetUtilization.toFixed(0)}% استفاده شده
        </div>
      </div>

      {/* Budget list */}
      <div className="flex-1 overflow-y-auto">
        {budgets.length === 0 ? (
          <div className="bg-white/70 rounded-2xl p-8 text-center">
            <span className="text-5xl mb-4 block">🎯</span>
            <p className="text-stone-600 mb-4">
              هنوز بودجه‌ای تنظیم نشده است
            </p>
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors">
              تنظیم بودجه
            </button>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg divide-y divide-stone-100">
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
