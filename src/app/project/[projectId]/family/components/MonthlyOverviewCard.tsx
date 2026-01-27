'use client'

import { CircularProgress } from './CircularProgress'

interface MonthlyOverviewCardProps {
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  currency: string
  periodKey: string
  onRefresh?: () => void
}

export function MonthlyOverviewCard({
  totalIncome,
  totalExpenses,
  savingsRate,
  currency,
  periodKey,
  onRefresh,
}: MonthlyOverviewCardProps) {
  const percentage =
    totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0

  // Parse period for display
  const [year, month] = periodKey.split('-')
  const monthNames = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ]
  const monthName = monthNames[parseInt(month, 10) - 1]

  return (
    <div className="h-screen w-full bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex flex-col items-center justify-center p-6 snap-start">
      {/* Period header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-stone-800 mb-1">
          {monthName} {year}
        </h2>
        <p className="text-sm text-stone-600">وضعیت مالی خانواده</p>
      </div>

      {/* Circular progress */}
      <div className="mb-8">
        <CircularProgress
          percentage={percentage}
          size={240}
          strokeWidth={16}
          income={totalIncome}
          expense={totalExpenses}
          currency={currency}
        />
      </div>

      {/* Stats cards */}
      <div className="w-full max-w-md space-y-3">
        {/* Income */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <div className="text-xs text-stone-600">درآمد</div>
                <div className="text-lg font-bold text-green-600">
                  {totalIncome.toLocaleString('fa-IR')}
                </div>
              </div>
            </div>
            <div className="text-xs text-stone-500">{currency}</div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <div className="text-xs text-stone-600">هزینه</div>
                <div className="text-lg font-bold text-red-600">
                  {totalExpenses.toLocaleString('fa-IR')}
                </div>
              </div>
            </div>
            <div className="text-xs text-stone-500">{currency}</div>
          </div>
        </div>

        {/* Savings rate */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <div className="text-xs text-stone-600">نرخ پس‌انداز</div>
                <div className="text-lg font-bold text-amber-600">
                  {savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pull to refresh hint */}
      <div className="mt-8 text-xs text-stone-400 text-center">
        برای به‌روزرسانی به پایین بکشید
      </div>
    </div>
  )
}
