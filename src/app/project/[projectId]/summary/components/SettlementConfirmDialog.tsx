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
 * UX Principles:
 * - Eliminate ambiguity
 * - Reduce fear of mistake
 * - One clear primary action
 * - Clear payment direction visualization
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
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            تأیید تسویه
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            لطفاً جزئیات تسویه را بررسی کن
          </p>
        </div>

        {/* Payment Direction - Visual Clarity */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
          {/* Direction Visualization: From → To (LTR for arrow) */}
          <div className="flex items-center justify-center gap-4" dir="ltr">
            {/* From Person */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {fromName.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {fromName}
              </span>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>

            {/* To Person */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {toName.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {toName}
              </span>
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
            پرداخت از {fromName} به {toName}
          </p>

          {/* Aggregation Note */}
          {isAggregated && settlementCount > 1 && (
            <p className="text-center text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
              شامل {settlementCount} تسویه تجمیع‌شده
            </p>
          )}
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-5 border border-green-100 dark:border-green-800/30">
          <p className="text-sm text-green-700 dark:text-green-400 text-center mb-2">
            مبلغ کل
          </p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 text-center">
            {formatMoney(amount, currency)}
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 text-center mt-2">
            با ثبت این تسویه، بدهی این حساب بسته می‌شود
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            برگشت
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 !bg-green-500 hover:!bg-green-600 text-white"
            loading={loading}
            disabled={loading}
          >
            ثبت تسویه ✓
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
