'use client'

import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'
import type { ParticipantExpenseBreakdown } from '@/types'

interface ParticipantExpenseBreakdownCardProps {
  breakdown: ParticipantExpenseBreakdown[]
  currency: string
  projectId: string
}

/**
 * نمایش تفکیک خرج‌ها بر اساس شرکت‌کنندگان
 * نشان می‌دهد که هر نفر چقدر خرج پرداخت کرده (به عنوان paidBy)
 */
export function ParticipantExpenseBreakdownCard({
  breakdown,
  currency,
  projectId,
}: ParticipantExpenseBreakdownCardProps) {
  const router = useRouter()

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
    <section className="px-4 mt-6">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
        💸 تفکیک خرج‌ها بر اساس پرداخت‌کننده
      </h2>

      <div className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
        {breakdown.map((participant, index) => (
          <button
            key={participant.participantId}
            onClick={() => handleParticipantClick(participant.participantId, participant.participantName)}
            className={`w-full p-4 text-right transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-[0.99] ${
              index !== breakdown.length - 1 ? 'border-b border-gray-100 dark:border-gray-800/50' : ''
            }`}
          >
            {/* Header: Avatar + Name + Amount */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar
                  avatar={deserializeAvatar(participant.participantAvatar, participant.participantName)}
                  name={participant.participantName}
                  size="lg"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {participant.participantName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {participant.expenseCount} خرج
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatMoney(participant.totalExpenses, currency)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {participant.percentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
    </section>
  )
}
