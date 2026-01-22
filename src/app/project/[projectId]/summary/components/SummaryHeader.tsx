'use client'

import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'

interface SummaryHeaderProps {
  projectName: string
  projectId: string
  totalExpenses: number
  participantCount: number
  currency: string
  onBack: () => void
}

/**
 * Blue gradient header with project summary stats
 */
export function SummaryHeader({
  projectName,
  projectId,
  totalExpenses,
  participantCount,
  currency,
  onBack,
}: SummaryHeaderProps) {
  const sharePerPerson = participantCount > 0 ? totalExpenses / participantCount : 0

  return (
    <div className="sticky top-0 z-10">
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white px-4 pt-4 pb-6">
        {/* Top Row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 -mr-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">خلاصه حساب</h1>
            <p className="text-blue-100 text-sm">{projectName}</p>
          </div>
          <Link
            href={`/project/${projectId}/settlements`}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
            title="تاریخچه تسویه‌ها"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </Link>
        </div>

        {/* Stats Card */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs mb-1">مجموع هزینه‌ها</p>
              <p className="text-2xl font-bold tracking-tight">
                {formatMoney(totalExpenses, currency)}
              </p>
            </div>
            <div className="text-left border-r border-white/20 pr-4">
              <p className="text-blue-100 text-xs mb-1">سهم هر نفر</p>
              <p className="text-lg font-semibold">
                {formatMoney(sharePerPerson, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
