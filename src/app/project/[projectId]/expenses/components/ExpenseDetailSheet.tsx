'use client'

import { BottomSheet } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface ExpenseShare {
  participantId: string
  participant: Participant
  amount: number
}

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
    id: string
    name: string
    icon: string
    color: string
  } | null
  periodKey?: string | null
  shares?: ExpenseShare[]
}

type Template = 'building' | 'travel' | 'family' | 'gathering'

interface ExpenseDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  expense: ExpenseDetail | null
  projectId: string
  template?: Template
  onEdit: () => void
  onDelete: () => void
}

/**
 * Get CSS variable based on template and token name
 * @example token('primary', 'travel') => 'var(--travel-primary)'
 */
function token(name: string, template: Template = 'building'): string {
  return `var(--${template}-${name})`
}

/**
 * Expense Detail Bottom Sheet - Read-Only Quick View (Template-Aware)
 *
 * UX Intent:
 * - Quick read-only view of expense details with clear hierarchy
 * - Amount as primary visual element
 * - Contextual badges for expense type
 * - Edit button navigates to full page (not inline editing)
 * - Clear actions with proper semantics
 * - Uses template-specific design tokens (building, travel, family, etc.)
 * - Shows participant split breakdown
 */
export function ExpenseDetailSheet({
  isOpen,
  onClose,
  expense,
  projectId,
  template = 'building',
  onEdit,
  onDelete,
}: ExpenseDetailSheetProps) {
  if (!expense) return null

  // Helper to get template-specific token
  const t = (name: string) => token(name, template)

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
        {/* Drag Handle */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Badges - Context indicators */}
        <div className="flex flex-wrap gap-2">
          {/* Public Expense Badge */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: t('info-alpha'),
              color: t('info'),
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
                backgroundColor: t('primary-alpha'),
                color: t('primary'),
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
            background: `linear-gradient(135deg, ${t('primary')} 0%, ${t('success')} 100%)`,
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
              style={{ color: t('text-primary') }}
            >
              {expense.title}
            </h2>
            {expense.category && (
              <p className="text-sm" style={{ color: t('text-secondary') }}>
                {expense.category.name}
              </p>
            )}
          </div>
        </div>

        {/* Details Grid - Improved spacing and dividers */}
        <div
          className="rounded-xl"
          style={{
            backgroundColor: t('surface-muted'),
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: t('border'),
          }}
        >
          {/* Payer */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{
              borderBottomWidth: '1px',
              borderBottomStyle: 'solid',
              borderBottomColor: t('border'),
            }}
          >
            <span className="text-sm font-medium" style={{ color: t('text-secondary') }}>
              پرداخت‌کننده
            </span>
            <span className="font-bold text-sm" style={{ color: t('text-primary') }}>
              {expense.paidBy.name}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium" style={{ color: t('text-secondary') }}>
              تاریخ
            </span>
            <span className="font-bold text-sm" style={{ color: t('text-primary') }}>
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Description (if available) */}
        {expense.description && (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: t('surface-muted'),
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: t('border'),
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: t('text-secondary') }}>
              توضیحات
            </p>
            <p className="text-sm leading-relaxed" style={{ color: t('text-primary') }}>
              {expense.description}
            </p>
          </div>
        )}

        {/* Participant Split Section */}
        {expense.shares && expense.shares.length > 0 && (
          <div>
            <h3 className="text-xs font-medium mb-3" style={{ color: t('text-secondary') }}>
              تقسیم بین هم‌سفرها
            </h3>
            <div className="space-y-2">
              {expense.shares.map((share) => {
                const isPayer = share.participant.id === expense.paidBy.id
                return (
                  <div
                    key={share.participantId}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      backgroundColor: isPayer ? t('primary-alpha') : t('surface-muted'),
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: isPayer ? t('primary') : t('border'),
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{
                        backgroundColor: isPayer ? t('primary') : t('border'),
                        color: isPayer ? '#ffffff' : t('text-secondary'),
                      }}
                    >
                      {share.participant.avatar ? (
                        <img
                          src={share.participant.avatar}
                          alt={share.participant.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        share.participant.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Name and Payer badge */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: t('text-primary') }}>
                        {share.participant.name}
                      </p>
                      {isPayer && (
                        <p className="text-xs mt-0.5" style={{ color: t('primary') }}>
                          پرداخت‌کننده
                        </p>
                      )}
                    </div>

                    {/* Share amount */}
                    <div className="flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: t('text-primary') }}>
                        {formatMoney(share.amount, expense.currency)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions - Improved semantics */}
        <div className="flex gap-3 pt-2">
          {/* Edit Button - Navigates to full page */}
          <button
            onClick={onEdit}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: t('surface-muted'),
              color: t('text-primary'),
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: t('border'),
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
            className="px-5 py-3.5 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: t('danger-alpha'),
              color: t('danger'),
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: t('danger'),
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            حذف خرج
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
