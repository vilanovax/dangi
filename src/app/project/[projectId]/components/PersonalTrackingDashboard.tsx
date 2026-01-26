'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Summary, Participant, Expense } from '@/types'

interface PersonalTrackingDashboardProps {
  projectId: string
  summary: Summary | null
  participants: Participant[]
  expenses: Expense[]
  currency: string
  totalExpenses: number
}

/**
 * Dashboard for Personal Template in Tracking Mode (خانواده)
 *
 * Features:
 * - Shows per-person spending (هر نفر چقدر خرج کرده)
 * - No balance/debt calculation
 * - No settlements
 * - Focus on expense tracking and analysis
 *
 * UX: Simple, family-friendly, informative
 */
export function PersonalTrackingDashboard({
  projectId,
  summary,
  participants,
  expenses,
  currency,
  totalExpenses,
}: PersonalTrackingDashboardProps) {
  const router = useRouter()

  // Calculate per-person spending (total paid by each)
  const balances = summary?.participantBalances || []
  const spendingData = balances
    .map((b) => ({
      participantId: b.participantId,
      participantName: b.participantName,
      totalPaid: b.totalPaid,
      percentage: totalExpenses > 0 ? (b.totalPaid / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid)

  // Format currency
  const formatAmount = (amount: number) => {
    if (currency === 'IRR' || currency === 'IRT') {
      return new Intl.NumberFormat('fa-IR').format(amount)
    }
    return new Intl.NumberFormat('en-US').format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions - Only expenses and summary */}
      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            {/* Expenses */}
            <Link
              href={`/project/${projectId}/expenses`}
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-[0.98] transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-blue-800 dark:text-blue-200">خرج‌ها</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 truncate">لیست کامل</p>
              </div>
            </Link>

            {/* Summary */}
            <Link
              href={`/project/${projectId}/summary`}
              className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 active:scale-[0.98] transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md shadow-purple-500/15 group-hover:scale-105 transition-transform flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-purple-800 dark:text-purple-200">تحلیل</p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 truncate">آمار و گزارش</p>
              </div>
            </Link>
          </div>

          {/* Info about tracking mode */}
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                فقط ردیابی - بدون تسویه حساب
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Person Spending */}
      {spendingData.length > 0 && totalExpenses > 0 && (
        <section className="px-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
            خرج هر نفر
          </h2>
          <div className="space-y-3">
            {spendingData.map((person, index) => (
              <div
                key={person.participantId}
                className="bg-white dark:bg-gray-900/80 rounded-xl p-4 border border-gray-100 dark:border-gray-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {person.participantName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {person.percentage.toFixed(1)}٪ از کل
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatAmount(person.totalPaid)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currency === 'IRR' ? 'تومان' : currency}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${person.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Total Family Spending Summary */}
      {totalExpenses > 0 && (
        <section className="px-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-5 border border-green-100 dark:border-green-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">جمع کل خرج</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {formatAmount(totalExpenses)}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                  {currency === 'IRR' ? 'تومان' : currency}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalExpenses === 0 && (
        <section className="px-4">
          <div className="bg-white dark:bg-gray-900/80 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800/50">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">هنوز خرجی ثبت نشده</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              وقتی خرج ثبت کنی، اینجا نمایش داده میشه
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
