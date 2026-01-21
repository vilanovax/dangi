'use client'

import { Card, Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'
import { formatMoney } from '@/lib/utils/money'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface ParticipantsSelectorProps {
  participants: Participant[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  paidById: string
  sharePerPerson: number | null
  currency: string
  label: string
  helper: string
  participantTerm: string
  onlyForYouMessage: string
}

/**
 * انتخاب شرکت‌کنندگان در تقسیم هزینه
 * پیام‌های کمکی برای حالت‌های خاص (فقط برای خودت، پرداخت‌کننده در لیست نیست)
 */
export function ParticipantsSelector({
  participants,
  selectedIds,
  onToggle,
  onSelectAll,
  paidById,
  sharePerPerson,
  currency,
  label,
  helper,
  participantTerm,
  onlyForYouMessage,
}: ParticipantsSelectorProps) {
  // بررسی حالت خاص: فقط یک نفر انتخاب شده و همان پرداخت‌کننده است
  const isOnlyForPayer = selectedIds.length === 1 && selectedIds[0] === paidById

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          انتخاب همه
        </button>
      </div>

      <Card className="divide-y divide-gray-100 dark:divide-gray-800">
        {participants.map((p) => {
          const isIncluded = selectedIds.includes(p.id)
          const isPayer = p.id === paidById

          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onToggle(p.id)}
              className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  avatar={deserializeAvatar(p.avatar || null, p.name)}
                  name={p.name}
                  size="md"
                />
                <div className="text-right">
                  <span className={isIncluded ? '' : 'text-gray-400'}>
                    {p.name}
                  </span>
                  {isPayer && (
                    <span className="text-xs text-gray-400 mr-1">(پرداخت‌کننده)</span>
                  )}
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isIncluded
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {isIncluded && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </Card>

      <p className="text-xs text-gray-400 mt-2">{helper}</p>

      {/* خلاصه تقسیم */}
      {selectedIds.length > 0 && sharePerPerson !== null && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {selectedIds.length} {participantTerm} × {formatMoney(sharePerPerson, currency)}
        </p>
      )}

      {/* پیام حالت خاص: فقط برای خودت */}
      {isOnlyForPayer && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
          {onlyForYouMessage}
        </p>
      )}
    </div>
  )
}
