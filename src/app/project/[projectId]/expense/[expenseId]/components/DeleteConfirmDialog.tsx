'use client'

import { BottomSheet, Button } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  expenseTitle: string
  expenseAmount: number
  currency: string
}

/**
 * Confirmation dialog for deleting an expense
 * Shows expense details and warns about irreversibility
 */
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  loading,
  expenseTitle,
  expenseAmount,
  currency,
}: DeleteConfirmDialogProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="حذف خرج">
      <div className="space-y-4">
        {/* Expense Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
          <p className="font-medium text-gray-900 dark:text-white">{expenseTitle}</p>
          <p className="text-lg font-bold text-red-500 mt-1">
            {formatMoney(expenseAmount, currency)}
          </p>
        </div>

        {/* Warning Message */}
        <p className="text-gray-600 dark:text-gray-400 text-center">
          این خرج از لیست حذف می‌شه و تموم محاسبات بدهی‌ها از نو انجام می‌شه.
          <br />
          <span className="text-red-500 text-sm">این کار قابل بازگشت نیست.</span>
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            انصراف
          </Button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className="flex-1 !bg-red-500 hover:!bg-red-600"
          >
            حذف کن
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
