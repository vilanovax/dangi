'use client'

import { BottomSheet, Button } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

interface SettlementConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fromName: string
  toName: string
  amount: number
  currency: string
  isAggregated?: boolean
  settlementCount?: number
  loading?: boolean
}

/**
 * Confirmation dialog for settlement with special handling for aggregated settlements
 *
 * UX Principle: Transparency = Trust
 * Users must clearly understand what will happen when settling aggregated settlements
 */
export function SettlementConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  fromName,
  toName,
  amount,
  currency,
  isAggregated = false,
  settlementCount = 1,
  loading = false,
}: SettlementConfirmDialogProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
          تأیید تسویه
        </h2>

        {/* Message */}
        <div className="text-center space-y-3">
          {isAggregated ? (
            <>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                با این کار، <strong>{settlementCount} تسویه</strong> بین
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {fromName} و {toName}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                به‌صورت یکجا تسویه می‌شن.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-700 dark:text-gray-300">
                تسویه بین
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {fromName} و {toName}
              </p>
            </>
          )}

          {/* Amount */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mt-4">
            <p className="text-sm text-green-700 dark:text-green-400 mb-1">
              مبلغ کل
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
            انصراف
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            loading={loading}
            disabled={loading}
          >
            تأیید
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
