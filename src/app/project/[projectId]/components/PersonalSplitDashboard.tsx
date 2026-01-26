'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Summary, Participant } from '@/types'

interface PersonalSplitDashboardProps {
  projectId: string
  summary: Summary | null
  participants: Participant[]
  currency: string
}

/**
 * Dashboard for Personal Template in Split Mode (هم‌خونه‌ها)
 *
 * Features:
 * - Shows who owes whom (balances)
 * - Settlement actions
 * - Expense tracking with split
 *
 * UX: Clean, focused on balance management
 */
export function PersonalSplitDashboard({
  projectId,
  summary,
  participants,
  currency,
}: PersonalSplitDashboardProps) {
  const router = useRouter()

  // Calculate balances
  const balances = summary?.participantBalances || []
  const debtors = balances.filter((b) => b.balance < -1).sort((a, b) => a.balance - b.balance)
  const creditors = balances.filter((b) => b.balance > 1).sort((a, b) => b.balance - a.balance)
  const isAllSettled = balances.every((b) => Math.abs(b.balance) < 1)

  // Format currency
  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount)
    if (currency === 'IRR' || currency === 'IRT') {
      return new Intl.NumberFormat('fa-IR').format(absAmount)
    }
    return new Intl.NumberFormat('en-US').format(absAmount)
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
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

          {/* Settlement Button */}
          <Link
            href={`/project/${projectId}/add-settlement`}
            className={`flex items-center justify-center gap-2.5 mt-3 p-2.5 rounded-xl transition-all active:scale-[0.98] ${
              isAllSettled
                ? 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'bg-green-50/70 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isAllSettled
                ? 'bg-gray-200 dark:bg-gray-700'
                : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm shadow-green-500/20'
            }`}>
              <svg className={`w-4 h-4 ${isAllSettled ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-center">
              <span className={`text-sm font-medium block ${
                isAllSettled
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-green-700 dark:text-green-300'
              }`}>
                {isAllSettled ? 'همه تسویه شدن ✓' : 'ثبت تسویه'}
              </span>
              {!isAllSettled && (
                <span className="text-[10px] text-green-600/60 dark:text-green-400/60">
                  پرداخت بدهی
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Balances Section */}
      {!isAllSettled && (debtors.length > 0 || creditors.length > 0) && (
        <section className="px-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
            تسویه حساب
          </h2>
          <div className="space-y-3">
            {/* Debtors (بدهکارها) */}
            {debtors.map((balance) => (
              <div
                key={balance.participantId}
                className="bg-red-50/50 dark:bg-red-950/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {balance.participantName}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">بدهکار</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatAmount(balance.balance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currency === 'IRR' ? 'تومان' : currency}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Creditors (طلبکارها) */}
            {creditors.map((balance) => (
              <div
                key={balance.participantId}
                className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-4 border border-green-100 dark:border-green-900/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {balance.participantName}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">طلبکار</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatAmount(balance.balance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currency === 'IRR' ? 'تومان' : currency}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Settled State */}
      {isAllSettled && (
        <section className="px-4">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-6 text-center border border-green-100 dark:border-green-900/30">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-green-700 dark:text-green-300 font-medium">همه چیز تسویه شده!</p>
            <p className="text-green-600/70 dark:text-green-400/70 text-sm mt-1">
              بدهی‌ای وجود نداره
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
