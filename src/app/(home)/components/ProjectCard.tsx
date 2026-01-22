'use client'

import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'

interface ProjectCardProps {
  id: string
  name: string
  templateIcon: string
  participantCount: number
  expenseCount: number
  totalExpenses: number
  myBalance: number
  currency: string
}

/**
 * Project card with stats, total expenses and balance
 */
export function ProjectCard({
  id,
  name,
  templateIcon,
  participantCount,
  expenseCount,
  totalExpenses,
  myBalance,
  currency,
}: ProjectCardProps) {
  const isCreditor = myBalance > 0
  const isDebtor = myBalance < 0
  const isSettled = myBalance === 0

  return (
    <Link href={`/project/${id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
            {templateIcon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {participantCount} نفر
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {expenseCount} هزینه
              </span>
            </div>
          </div>

          {/* Arrow */}
          <svg
            className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Total */}
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">مجموع هزینه‌ها</p>
            <p className="font-bold text-sm">{formatMoney(totalExpenses, currency)}</p>
          </div>

          {/* Balance Badge */}
          {isSettled ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">تسویه شده</span>
            </div>
          ) : isCreditor ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                {formatMoney(myBalance, currency)} طلب
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20">
              <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              <span className="text-xs font-bold text-red-500 dark:text-red-400">
                {formatMoney(Math.abs(myBalance), currency)} بدهی
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
