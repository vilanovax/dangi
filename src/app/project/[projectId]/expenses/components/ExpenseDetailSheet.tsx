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
 * - Quick view of expense details with clear hierarchy
 * - Amount as primary visual element
 * - Contextual badges for expense type
 * - Clear actions with proper semantics
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

  // Parse period key to readable format (e.g. "1404-01" → "فروردین ۱۴۰۴")
  const formatPeriodKey = (periodKey: string | null | undefined) => {
    if (!periodKey) return null
    const [year, month] = periodKey.split('-')
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]
    const monthIndex = parseInt(month, 10) - 1
    return `${monthNames[monthIndex]} ${year}`
  }

  const isRecurring = expense.periodKey !== null && expense.periodKey !== undefined

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="جزئیات خرج">
      <div className="space-y-5">
        {/* Badges - Context indicators */}
        <div className="flex flex-wrap gap-2">
          {/* Public Expense Badge */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: 'var(--building-info-alpha)',
              color: 'var(--building-info)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            هزینه عمومی
          </span>

          {/* Recurring Badge */}
          {isRecurring && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: 'var(--building-primary-alpha)',
                color: 'var(--building-primary)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {formatPeriodKey(expense.periodKey)}
            </span>
          )}
        </div>

        {/* Amount - Primary Visual Element */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--building-primary) 0%, var(--building-success) 100%)',
          }}
        >
          <p className="text-xs mb-1.5 text-white/80 font-medium">
            مبلغ
          </p>
          <p className="text-4xl font-bold text-white">
            {formatMoney(expense.amount, expense.currency)}
          </p>
        </div>

        {/* Category & Title */}
        <div className="flex items-start gap-3">
          {expense.category && (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${expense.category.color}15`,
              }}
            >
              <span className="text-xl">{expense.category.icon}</span>
            </div>
          )}
          <div className="flex-1">
            <h2
              className="text-lg font-bold leading-tight mb-1"
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

        {/* Details Grid - Improved spacing and dividers */}
        <div
          className="rounded-xl"
          style={{
            backgroundColor: 'var(--building-surface-muted)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)',
          }}
        >
          {/* Payer */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{
              borderBottomWidth: '1px',
              borderBottomStyle: 'solid',
              borderBottomColor: 'var(--building-border)',
            }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--building-text-secondary)' }}>
              پرداخت‌کننده
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--building-text-primary)' }}>
              {expense.paidBy.name}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium" style={{ color: 'var(--building-text-secondary)' }}>
              تاریخ
            </span>
            <span className="font-bold text-sm" style={{ color: 'var(--building-text-primary)' }}>
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Description (if available) */}
        {expense.description && (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--building-surface-muted)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-border)',
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--building-text-secondary)' }}>
              توضیحات
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--building-text-primary)' }}>
              {expense.description}
            </p>
          </div>
        )}

        {/* Actions - Improved semantics */}
        <div className="flex gap-3 pt-2">
          {/* Edit Button - Primary action */}
          <button
            onClick={onEdit}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--building-surface-muted)',
              color: 'var(--building-text-primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-border)',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            ویرایش خرج
          </button>

          {/* Delete Button - Destructive action */}
          <button
            onClick={onDelete}
            className="px-5 py-3.5 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center"
            style={{
              backgroundColor: 'var(--building-danger-alpha)',
              color: 'var(--building-danger)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-danger)',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
