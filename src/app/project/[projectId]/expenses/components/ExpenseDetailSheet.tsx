'use client'

import { BottomSheet, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'

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
 * Expense Detail Bottom Sheet
 * Shows expense details with payer info, date, and split breakdown
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
  // Show loading state when sheet is open but expense data is not loaded yet
  if (!expense) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="جزئیات خرج">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </BottomSheet>
    )
  }

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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="جزئیات خرج">
      <div className="space-y-4 pb-safe">
        {/* UX: Title + Category row */}
        <div className="flex items-center gap-3">
          {expense.category && (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${expense.category.color}15` }}
            >
              <span className="text-2xl">{expense.category.icon}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {expense.title}
            </h3>
            {expense.category && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {expense.category.name}
              </p>
            )}
          </div>
        </div>

        {/* UX: Amount card - prominent but compact */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-white mb-1">
            {formatMoney(expense.amount, expense.currency)}
          </p>
          <p className="text-xs text-white/70">مبلغ کل خرج</p>
        </div>

        {/* UX: Payer + Date grouped in compact card */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">پرداخت‌کننده</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{expense.paidBy.name}</span>
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">تاریخ</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{formattedDate}</span>
          </div>
        </div>

        {/* UX: Split section */}
        {sortedShares.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              تقسیم بین هم‌سفرها
            </h3>
            <div className="space-y-2">
              {sortedShares.map((share) => {
                const isPayer = share.participantId === expense.paidById

                return (
                  <div
                    key={share.participantId}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                  >
                    <Avatar
                      avatar={deserializeAvatar(share.participant.avatar || null, share.participant.name)}
                      name={share.participant.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {share.participant.name}
                      </p>
                      {isPayer && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">پرداخت‌کننده</p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {formatMoney(share.amount, expense.currency)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* UX: Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onEdit}
            className="flex-1 py-3 px-4 rounded-xl font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            ویرایش
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-3 rounded-xl font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            حذف
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
