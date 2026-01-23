'use client'

import { Card, Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'
import { formatMoney, parseMoney } from '@/lib/utils/money'

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
  // Manual split mode props
  splitMode?: 'EQUAL' | 'MANUAL'
  customAmounts?: Record<string, string>
  onCustomAmountChange?: (participantId: string, amount: string) => void
  totalAmount?: number
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
  splitMode = 'EQUAL',
  customAmounts = {},
  onCustomAmountChange,
  totalAmount = 0,
}: ParticipantsSelectorProps) {
  // بررسی حالت خاص: فقط یک نفر انتخاب شده و همان پرداخت‌کننده است
  const isOnlyForPayer = selectedIds.length === 1 && selectedIds[0] === paidById

  // Calculate custom amounts total for MANUAL mode
  const customTotal = splitMode === 'MANUAL'
    ? participants.reduce((sum, p) => sum + (parseMoney(customAmounts[p.id] || '0') || 0), 0)
    : 0
  const customAmountsValid = splitMode === 'MANUAL' && totalAmount > 0 && Math.abs(customTotal - totalAmount) <= 1
  const remaining = totalAmount - customTotal

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
            <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
              {/* EQUAL mode: clickable row with checkbox */}
              {splitMode === 'EQUAL' ? (
                <button
                  type="button"
                  onClick={() => onToggle(p.id)}
                  className="w-full flex items-center justify-between"
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
              ) : (
                /* MANUAL mode: avatar + name + amount input */
                <>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Avatar
                      avatar={deserializeAvatar(p.avatar || null, p.name)}
                      name={p.name}
                      size="md"
                    />
                    <div className="text-right">
                      <span>{p.name}</span>
                      {isPayer && (
                        <span className="text-xs text-gray-400 mr-1">(پرداخت‌کننده)</span>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="۰"
                    value={customAmounts[p.id] || ''}
                    onChange={(e) => onCustomAmountChange?.(p.id, e.target.value)}
                    className="w-28 text-left px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    dir="ltr"
                  />
                </>
              )}
            </div>
          )
        })}
      </Card>

      <p className="text-xs text-gray-400 mt-2">{helper}</p>

      {/* خلاصه تقسیم - EQUAL mode */}
      {splitMode === 'EQUAL' && selectedIds.length > 0 && sharePerPerson !== null && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {selectedIds.length} {participantTerm} × {formatMoney(sharePerPerson, currency)}
        </p>
      )}

      {/* خلاصه تقسیم - MANUAL mode */}
      {splitMode === 'MANUAL' && totalAmount > 0 && (
        <div className={`mt-3 p-3 rounded-xl text-center text-sm ${
          customAmountsValid
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {customAmountsValid ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span>
              جمع: {formatMoney(customTotal, currency)} از {formatMoney(totalAmount, currency)}
            </span>
          </div>
          {!customAmountsValid && remaining !== 0 && (
            <p className="text-xs mt-1">
              {remaining > 0 ? `${formatMoney(remaining, currency)} باقی‌مانده` : `${formatMoney(Math.abs(remaining), currency)} اضافه`}
            </p>
          )}
        </div>
      )}

      {/* پیام حالت خاص: فقط برای خودت */}
      {splitMode === 'EQUAL' && isOnlyForPayer && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
          {onlyForYouMessage}
        </p>
      )}
    </div>
  )
}
