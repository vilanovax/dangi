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
  paidById: string
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
  myParticipantId?: string | null
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
 * Expense Detail Bottom Sheet - Refactored for Visual Clarity
 *
 * UX Improvements (Matching Spec):
 * - Increased header spacing for breathing room
 * - Amount as visual centerpiece with gradient + currency label
 * - Category badge lighter, positioned near title
 * - Payer + date grouped in single card
 * - Current user's share highlighted at top
 * - Payer badge softened (smaller, muted color)
 * - Sticky action bar with safe-area padding
 *
 * Visual Hierarchy:
 * 1. Amount (primary visual focus)
 * 2. Title + Category icon
 * 3. Payer + Date info card
 * 4. Split breakdown (user first, payer second)
 * 5. Action buttons
 */
export function ExpenseDetailSheet({
  isOpen,
  onClose,
  expense,
  projectId,
  template = 'building',
  myParticipantId,
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

  // UX: Sort shares - current user first, then payer, then others
  const sortedShares = expense.shares
    ? [...expense.shares].sort((a, b) => {
        const aIsMe = a.participantId === myParticipantId
        const bIsMe = b.participantId === myParticipantId
        const aIsPayer = a.participantId === expense.paidById
        const bIsPayer = b.participantId === expense.paidById

        // Current user always first
        if (aIsMe && !bIsMe) return -1
        if (!aIsMe && bIsMe) return 1

        // Then payer
        if (aIsPayer && !bIsPayer) return -1
        if (!aIsPayer && bIsPayer) return 1

        return 0
      })
    : []

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6 pb-safe">
        {/* UX: Increased spacing between drag handle and content */}
        <div className="flex justify-center -mt-2 mb-6">
          <div className="w-12 h-1 rounded-full" style={{ backgroundColor: t('border') }} />
        </div>

        {/* UX: Reduced title weight - sheet context, not full page */}
        <h2 className="text-lg font-semibold text-center -mt-2" style={{ color: t('text-primary') }}>
          جزئیات خرج
        </h2>

        {/* UX: Category badge - lighter, positioned before amount */}
        {expense.category && (
          <div className="flex justify-center -mb-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
              style={{
                backgroundColor: t('surface-muted'),
                color: t('text-secondary'),
              }}
            >
              <span className="text-base">{expense.category.icon}</span>
              هزینه عمومی
            </span>
          </div>
        )}

        {/* UX: Amount as visual centerpiece with gradient + currency label */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${t('primary')} 0%, ${t('success')} 100%)`,
          }}
        >
          <p className="text-xs mb-2 text-white/70 font-medium">مبلغ</p>
          <p className="text-4xl font-bold text-white tracking-tight mb-1">
            {formatMoney(expense.amount, expense.currency)}
          </p>
          <p className="text-sm text-white/60">تومان</p>
        </div>

        {/* Category + Title Section */}
        <div className="flex items-start gap-3">
          {expense.category && (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${expense.category.color}15`,
              }}
            >
              <span className="text-3xl">{expense.category.icon}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-base font-bold leading-tight mb-1" style={{ color: t('text-primary') }}>
              {expense.title}
            </h3>
            {expense.category && (
              <p className="text-sm" style={{ color: t('text-secondary') }}>
                {expense.category.name}
              </p>
            )}
          </div>
        </div>

        {/* UX: Payer + Date grouped in single visual card */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            backgroundColor: t('surface-muted'),
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: t('border'),
          }}
        >
          {/* Payer Row */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: t('text-secondary') }}>
              پرداخت‌کننده
            </p>
            <p className="text-sm font-semibold" style={{ color: t('text-primary') }}>
              {expense.paidBy.name}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: t('border') }} />

          {/* Date Row */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: t('text-secondary') }}>
              تاریخ
            </p>
            <p className="text-sm font-semibold" style={{ color: t('text-primary') }}>
              {formattedDate}
            </p>
          </div>
        </div>

        {/* UX: Split section with current user highlighted at top */}
        {sortedShares.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold mb-3" style={{ color: t('text-secondary') }}>
              تقسیم بین هم‌سفرها
            </h3>
            <div className="space-y-2">
              {sortedShares.map((share) => {
                const isMe = share.participantId === myParticipantId
                const isPayer = share.participantId === expense.paidById

                return (
                  <div
                    key={share.participantId}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{
                      // UX: Current user gets success color highlight
                      backgroundColor: isMe ? t('success-alpha') : t('surface-muted'),
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: isMe ? t('success') : t('border'),
                    }}
                  >
                    {/* Avatar Placeholder (circular initials) */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{
                        backgroundColor: isMe ? t('success') : t('border'),
                        color: '#ffffff',
                      }}
                    >
                      {share.participant.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + Role Label */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: t('text-primary') }}>
                        {share.participant.name}
                      </p>
                      {/* UX: Label current user clearly */}
                      {isMe && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: t('success') }}>
                          پرداخت‌کننده
                        </p>
                      )}
                      {/* UX: Payer badge softened (smaller, less prominent) */}
                      {isPayer && !isMe && (
                        <p className="text-[10px] mt-0.5" style={{ color: t('text-muted') }}>
                          پرداخت‌کننده
                        </p>
                      )}
                    </div>

                    {/* Share Amount */}
                    <div className="flex-shrink-0 text-left">
                      <p className="font-bold text-sm" style={{ color: t('text-primary') }}>
                        {formatMoney(share.amount, expense.currency)}
                      </p>
                      <p className="text-[10px]" style={{ color: t('text-muted') }}>
                        تومان
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* UX: Sticky action bar with safe-area bottom padding */}
        <div
          className="sticky bottom-0 -mx-6 -mb-6 px-6 pb-6 pt-4 flex gap-3"
          style={{
            backgroundColor: t('surface'),
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: t('border'),
          }}
        >
          {/* Edit Button - Primary Action */}
          <button
            onClick={onEdit}
            className="flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: t('primary'),
              color: '#ffffff',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            ویرایش خرج
          </button>

          {/* Delete Button - Secondary/Destructive */}
          <button
            onClick={onDelete}
            className="px-5 py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: t('danger-alpha'),
              color: t('danger'),
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: t('danger'),
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            حذف خرج
          </button>
        </div>

        {/* UX: Optional first-time helper text (can be shown with state) */}
        {/* <p className="text-center text-xs -mb-2" style={{ color: t('text-muted') }}>
          برای بستن، پایین بکش
        </p> */}
      </div>
    </BottomSheet>
  )
}
