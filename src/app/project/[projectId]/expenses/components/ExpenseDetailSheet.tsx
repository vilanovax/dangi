'use client'

import { BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

interface ExpenseDetail {
  id: string
  title: string
  amount: number
  currency: string
  expenseDate: string
  description?: string
  paidBy: {
    id: string
    name: string
  }
  category?: {
    name: string
    icon: string
    color: string
  } | null
  periodKey?: string | null
}

interface ExpenseDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  expense: ExpenseDetail | null
  projectId: string
  onEdit: () => void
  onDelete: () => void
}

/**
 * Expense Detail Bottom Sheet - Final Polish
 *
 * UX Intent:
 * - Quick view of expense details
 * - Clear actions for edit and delete
 * - Uses building design tokens for consistency
 */
export function ExpenseDetailSheet({
  isOpen,
  onClose,
  expense,
  projectId,
  onEdit,
  onDelete,
}: ExpenseDetailSheetProps) {
  if (!expense) return null

  const formattedDate = new Date(expense.expenseDate).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="جزئیات خرج">
      <div className="space-y-6">
        {/* Category & Title */}
        <div className="flex items-start gap-3">
          {expense.category && (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${expense.category.color}15`,
              }}
            >
              <span className="text-2xl">{expense.category.icon}</span>
            </div>
          )}
          <div className="flex-1">
            <h2
              className="text-xl font-bold leading-tight mb-1"
              style={{ color: 'var(--building-text-primary)' }}
            >
              {expense.title}
            </h2>
            {expense.category && (
              <p className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
                {expense.category.name}
              </p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--building-surface-muted)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)',
          }}
        >
          <p className="text-sm mb-1" style={{ color: 'var(--building-text-secondary)' }}>
            مبلغ
          </p>
          <p className="text-3xl font-bold" style={{ color: 'var(--building-text-primary)' }}>
            {formatMoney(expense.amount, expense.currency)}
          </p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3">
          {/* Payer */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
              پرداخت‌کننده
            </span>
            <span className="font-medium" style={{ color: 'var(--building-text-primary)' }}>
              {expense.paidBy.name}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
              تاریخ
            </span>
            <span className="font-medium" style={{ color: 'var(--building-text-primary)' }}>
              {formattedDate}
            </span>
          </div>

          {/* Period (if available) */}
          {expense.periodKey && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--building-text-secondary)' }}>
                دوره
              </span>
              <span className="font-medium" style={{ color: 'var(--building-info)' }}>
                {expense.periodKey}
              </span>
            </div>
          )}
        </div>

        {/* Description (if available) */}
        {expense.description && (
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--building-text-secondary)' }}>
              توضیحات
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--building-text-primary)' }}>
              {expense.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="flex-1 py-3.5 rounded-xl font-medium transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--building-primary)',
              color: 'white',
            }}
          >
            ویرایش خرج
          </button>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="px-5 py-3.5 rounded-xl font-medium transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--building-danger-alpha)',
              color: 'var(--building-danger)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-danger)',
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
