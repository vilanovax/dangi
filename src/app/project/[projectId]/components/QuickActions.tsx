'use client'

import Link from 'next/link'
import { getTemplate } from '@/lib/domain/templates'

interface QuickActionsProps {
  projectId: string
  template?: string
  /** Pass true if all balances are settled */
  isSettled?: boolean
}

/**
 * Quick actions for travel project
 *
 * UX Intent:
 * - "Expenses" is the primary action (larger, more prominent)
 * - "Summary" is secondary, informative
 * - "Settlement" appears softer/muted when balances are settled
 * - Helper text under each action for clarity
 * - Calm spacing, no visual pressure
 */
export function QuickActions({ projectId, template, isSettled = false }: QuickActionsProps) {
  const templateDef = template ? getTemplate(template) : null
  const showChargeDashboard = templateDef?.supportsChargeRules

  return (
    <div className="px-4 -mt-4 space-y-4">
      {/* Charge Dashboard - Only for building template */}
      {showChargeDashboard && (
        <Link href={`/project/${projectId}/building`} className="block">
          <div className="p-4 bg-gradient-to-l from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-200">داشبورد شارژ</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">وضعیت پرداخت شارژ ماهیانه</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Quick Actions - 2 column layout for travel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          {/* Expenses - Primary action */}
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
              <p className="font-semibold text-blue-800 dark:text-blue-200">هزینه‌ها</p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 truncate">لیست خرج‌ها</p>
            </div>
          </Link>

          {/* Summary - Secondary */}
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
              <p className="font-semibold text-purple-800 dark:text-purple-200">خلاصه</p>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 truncate">کی چقدر داده؟</p>
            </div>
          </Link>
        </div>

        {/* Settlement - Tertiary, subtle when settled, with helper text */}
        <Link
          href={`/project/${projectId}/add-settlement`}
          className={`flex items-center justify-center gap-2.5 mt-3 p-2.5 rounded-xl transition-all active:scale-[0.98] ${
            isSettled
              ? 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'bg-green-50/70 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSettled
              ? 'bg-gray-200 dark:bg-gray-700'
              : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm shadow-green-500/20'
          }`}>
            <svg className={`w-4 h-4 ${isSettled ? 'text-gray-500 dark:text-gray-400' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-center">
            <span className={`text-sm font-medium block ${
              isSettled
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-green-700 dark:text-green-300'
            }`}>
              {isSettled ? 'همه تسویه شدن ✓' : 'ثبت تسویه'}
            </span>
            {/* Helper text - friendly explanation */}
            {!isSettled && (
              <span className="text-[10px] text-green-600/60 dark:text-green-400/60">
                صاف‌کردن حسابا
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
}
