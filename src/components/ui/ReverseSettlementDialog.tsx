'use client'

import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'
import { Avatar } from './Avatar'
import { formatMoney } from '@/lib/utils/money'
import type { Avatar as AvatarData } from '@/lib/types/avatar'

interface ReverseSettlementDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (note?: string) => void
  from: { name: string; avatar: AvatarData | null }
  to: { name: string; avatar: AvatarData | null }
  amount: number
  currency: string
  submitting: boolean
}

/**
 * Confirmation dialog for reversing a settlement
 * Creates a counter-entry to cancel out the original settlement
 */
export function ReverseSettlementDialog({
  isOpen,
  onClose,
  onConfirm,
  from,
  to,
  amount,
  currency,
  submitting,
}: ReverseSettlementDialogProps) {
  const [note, setNote] = useState('')

  const handleConfirm = () => {
    onConfirm(note || undefined)
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="بازگردانی تسویه">
      <div className="space-y-5">
        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                بازگردانی تسویه
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                یک تسویه معکوس ثبت می‌شود (تسویه اصلی حذف نمی‌شود).
              </p>
            </div>
          </div>
        </div>

        {/* Original Settlement Preview */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">تسویه اصلی:</p>
          {/* Force LTR for payment direction (From → To) to match arrow */}
          <div className="flex items-center justify-between" dir="ltr">
            {/* From */}
            <div className="flex-1 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12">
                  {from.avatar ? (
                    <Avatar avatar={from.avatar} name={from.name} size="lg" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        {from.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{from.name}</span>
              </div>
            </div>

            {/* Arrow */}
            <svg
              className="w-6 h-6 text-gray-400 mx-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>

            {/* To */}
            <div className="flex-1 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12">
                  {to.avatar ? (
                    <Avatar avatar={to.avatar} name={to.name} size="lg" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {to.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{to.name}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
              {formatMoney(amount, currency)}
            </p>
          </div>
        </div>

        {/* Reverse Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="دلیل بازگردانی را بنویسید..."
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows={3}
            disabled={submitting}
          />
        </div>

        {/* Explanation */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          پس از تأیید، یک تسویه معکوس از <strong>{to.name}</strong> به <strong>{from.name}</strong>{' '}
          ثبت می‌شود.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            size="lg"
            disabled={submitting}
          >
            انصراف
          </Button>
          <Button
            onClick={handleConfirm}
            loading={submitting}
            className="flex-1 !bg-amber-500 hover:!bg-amber-600"
            size="lg"
          >
            تأیید بازگردانی
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
