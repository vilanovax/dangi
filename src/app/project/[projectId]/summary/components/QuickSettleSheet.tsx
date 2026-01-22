'use client'

import { BottomSheet, Button, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import type { Avatar as AvatarData } from '@/lib/types/avatar'

interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

interface QuickSettleSheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  settlement: Settlement | null
  fromAvatar: AvatarData | null
  toAvatar: AvatarData | null
  currency: string
  submitting: boolean
}

/**
 * Bottom sheet confirmation for quick settlement
 */
export function QuickSettleSheet({
  isOpen,
  onClose,
  onConfirm,
  settlement,
  fromAvatar,
  toAvatar,
  currency,
  submitting,
}: QuickSettleSheetProps) {
  if (!settlement) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="تأیید تسویه">
      <div className="space-y-5">
        {/* Transfer Preview */}
        <div className="bg-gradient-to-l from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-green-100 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            {/* From */}
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                پرداخت‌کننده
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14">
                  {fromAvatar ? (
                    <Avatar avatar={fromAvatar} name={settlement.fromName} size="xl" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        {settlement.fromName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold">{settlement.fromName}</span>
              </div>
            </div>

            {/* Arrow + Amount */}
            <div className="flex flex-col items-center gap-1.5 px-3">
              <svg
                className="w-7 h-7 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                {formatMoney(settlement.amount, currency)}
              </span>
            </div>

            {/* To */}
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                دریافت‌کننده
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14">
                  {toAvatar ? (
                    <Avatar avatar={toAvatar} name={settlement.toName} size="xl" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        {settlement.toName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold">{settlement.toName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Text */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          این تسویه ثبت شود؟
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
            onClick={onConfirm}
            loading={submitting}
            className="flex-1 !bg-green-500 hover:!bg-green-600"
            size="lg"
          >
            تأیید تسویه
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
