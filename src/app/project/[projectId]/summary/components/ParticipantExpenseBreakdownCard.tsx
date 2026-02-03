'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'
import type { ParticipantExpenseBreakdown } from '@/types'

interface ParticipantExpenseBreakdownCardProps {
  breakdown: ParticipantExpenseBreakdown[]
  currency: string
  projectId: string
  defaultExpanded?: boolean
}

/**
 * نمایش تفکیک خرج‌ها بر اساس شرکت‌کنندگان
 * نشان می‌دهد که هر نفر چقدر خرج پرداخت کرده (به عنوان paidBy)
 */
export function ParticipantExpenseBreakdownCard({
  breakdown,
  currency,
  projectId,
  defaultExpanded = false,
}: ParticipantExpenseBreakdownCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (breakdown.length === 0) {
    return null
  }

  const handleParticipantClick = (participantId: string, participantName: string) => {
    // Navigate to expenses page with payer filter
    const params = new URLSearchParams()
    params.set('payer', participantId)
    params.set('payerName', participantName)

    router.push(`/project/${projectId}/expenses?${params.toString()}`)
  }

  return (
    <section>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          تفکیک خرج‌ها بر اساس پرداخت‌کننده
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {breakdown.length} نفر
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-900/80 rounded-xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
          {breakdown.map((participant, index) => (
            <button
              key={participant.participantId}
              onClick={() => handleParticipantClick(participant.participantId, participant.participantName)}
              className={`w-full p-3 text-right transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-[0.99] ${
                index !== breakdown.length - 1 ? 'border-b border-gray-100 dark:border-gray-800/50' : ''
              }`}
            >
              {/* Header: Avatar + Name + Amount */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    avatar={deserializeAvatar(participant.participantAvatar, participant.participantName)}
                    name={participant.participantName}
                    size="md"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {participant.participantName}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {participant.expenseCount} خرج
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {formatMoney(participant.totalExpenses, currency)}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {participant.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{
                    width: `${participant.percentage}%`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
