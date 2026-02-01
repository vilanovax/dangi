'use client'

import { BottomSheet, Button } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

interface SettlementConfirmSheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fromName: string
  toName: string
  amount: number
  currency: string
  loading?: boolean
}

/**
 * Pre-submit confirmation for large settlement amounts
 *
 * UX Principle: Safety = Confidence
 * Users should confirm large settlements to prevent accidental submissions
 */
export function SettlementConfirmSheet({
  isOpen,
  onClose,
  onConfirm,
  fromName,
  toName,
  amount,
  currency,
  loading = false,
}: SettlementConfirmSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
          تأیید نهایی
        </h2>

        {/* Message */}
        <div className="text-center space-y-3">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            مبلغ کمی زیاد به نظر میاد. مطمئنی که درسته؟
          </p>

          {/* Settlement Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">پرداخت‌کننده:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{fromName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">دریافت‌کننده:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{toName}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mt-4">
            <p className="text-sm text-green-700 dark:text-green-400 mb-1">
              مبلغ
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatMoney(amount, currency)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            بذار دوباره چک کنم
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            loading={loading}
            disabled={loading}
          >
            آره، مطمئنم
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
