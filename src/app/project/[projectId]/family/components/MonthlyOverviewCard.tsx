'use client'

import { useRouter } from 'next/navigation'
import { CircularProgress } from './CircularProgress'
import { familyTheme } from '@/styles/family-theme'

interface MonthlyOverviewCardProps {
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  currency: string
  periodKey: string
  projectId: string
  onRefresh?: () => void
}

export function MonthlyOverviewCard({
  totalIncome,
  totalExpenses,
  savingsRate,
  currency,
  periodKey,
  projectId,
  onRefresh,
}: MonthlyOverviewCardProps) {
  const router = useRouter()

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
    <div
      className="h-screen w-full flex flex-col items-center justify-center p-6 snap-start"
      style={{ backgroundColor: familyTheme.colors.background }}
    >
      {/* Period header */}
      <div className="text-center mb-8">
        <h2
          className="font-bold mb-1"
          style={{
            fontSize: familyTheme.typography.pageTitle.size,
            fontWeight: familyTheme.typography.pageTitle.weight,
            color: familyTheme.colors.textPrimary
          }}
        >
          {monthName} {year}
        </h2>
        <p
          className="text-stone-600"
          style={{ fontSize: familyTheme.typography.small.size }}
        >
          وضعیت مالی خانواده
        </p>
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
        <button
          onClick={() => router.push(`/project/${projectId}/family/transactions?filter=income`)}
          className="w-full rounded-2xl p-4 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: familyTheme.colors.card,
            boxShadow: familyTheme.card.shadow
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: familyTheme.colors.successSoft }}
              >
                <span className="text-lg">💰</span>
              </div>
              <div className="text-right">
                <div
                  style={{
                    fontSize: familyTheme.typography.small.size,
                    color: familyTheme.colors.textSecondary
                  }}
                >
                  درآمد
                </div>
                <div
                  className="font-bold"
                  style={{
                    fontSize: familyTheme.typography.cardNumber.size,
                    fontWeight: familyTheme.typography.cardNumber.weight,
                    color: familyTheme.colors.success
                  }}
                >
                  {totalIncome.toLocaleString('fa-IR')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  fontSize: familyTheme.typography.small.size,
                  color: familyTheme.colors.textTertiary
                }}
              >
                {currency}
              </div>
              <span className="text-stone-400">←</span>
            </div>
          </div>
        </button>

        {/* Expenses */}
        <button
          onClick={() => router.push(`/project/${projectId}/family/transactions?filter=expense`)}
          className="w-full rounded-2xl p-4 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: familyTheme.colors.card,
            boxShadow: familyTheme.card.shadow
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: familyTheme.colors.dangerSoft }}
              >
                <span className="text-lg">💸</span>
              </div>
              <div className="text-right">
                <div
                  style={{
                    fontSize: familyTheme.typography.small.size,
                    color: familyTheme.colors.textSecondary
                  }}
                >
                  هزینه
                </div>
                <div
                  className="font-bold"
                  style={{
                    fontSize: familyTheme.typography.cardNumber.size,
                    fontWeight: familyTheme.typography.cardNumber.weight,
                    color: familyTheme.colors.danger
                  }}
                >
                  {totalExpenses.toLocaleString('fa-IR')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  fontSize: familyTheme.typography.small.size,
                  color: familyTheme.colors.textTertiary
                }}
              >
                {currency}
              </div>
              <span className="text-stone-400">←</span>
            </div>
          </div>
        </button>

        {/* Savings rate */}
        <button
          onClick={() => router.push(`/project/${projectId}/family/reports`)}
          className="w-full rounded-2xl p-4 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: familyTheme.colors.card,
            boxShadow: familyTheme.card.shadow
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: familyTheme.colors.infoSoft }}
              >
                <span className="text-lg">📈</span>
              </div>
              <div className="text-right">
                <div
                  style={{
                    fontSize: familyTheme.typography.small.size,
                    color: familyTheme.colors.textSecondary
                  }}
                >
                  نرخ پس‌انداز
                </div>
                <div
                  className="font-bold"
                  style={{
                    fontSize: familyTheme.typography.cardNumber.size,
                    fontWeight: familyTheme.typography.cardNumber.weight,
                    color: familyTheme.colors.info
                  }}
                >
                  {savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>
            <span className="text-stone-400">←</span>
          </div>
        </button>
      </div>

      {/* Pull to refresh hint */}
      <div
        className="mt-8 text-center"
        style={{
          fontSize: familyTheme.typography.small.size,
          color: familyTheme.colors.textTertiary
        }}
      >
        برای به‌روزرسانی به پایین بکشید
      </div>
    </div>
  )
}
