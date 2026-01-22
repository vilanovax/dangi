'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatMoney } from '@/lib/utils/money'

interface DashboardHeaderProps {
  projectId: string
  projectName: string
  participantCount: number
  totalExpenses: number
  currency: string
}

/**
 * Blue gradient header for project dashboard
 * Shows project info and total expenses
 */
export function DashboardHeader({
  projectId,
  projectName,
  participantCount,
  totalExpenses,
  currency,
}: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-8 rounded-b-3xl">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push('/')}
          className="p-2 -mr-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <Link
          href={`/project/${projectId}/settings`}
          className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      </div>

      {/* Project Info */}
      <h1 className="text-2xl font-bold mb-1">{projectName}</h1>
      <p className="text-blue-100 text-sm mb-4">{participantCount} نفر</p>

      {/* Total Card */}
      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
        <p className="text-blue-100 text-sm mb-1">مجموع هزینه‌ها</p>
        <p className="text-3xl font-bold">{formatMoney(totalExpenses, currency)}</p>
      </div>
    </div>
  )
}
