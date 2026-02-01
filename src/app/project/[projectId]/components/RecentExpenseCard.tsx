'use client'

import { formatMoney } from '@/lib/utils/money'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Participant {
  id: string
  name: string
}

interface ExpenseShare {
  participantId: string
  amount: number
}

interface RecentExpenseCardProps {
  id: string
  projectId: string
  title: string
  amount: number
  currency: string
  paidBy: Participant
  category?: Category
  expenseDate: string
  shares?: ExpenseShare[]
  myParticipantId?: string | null
  onClick?: () => void
}

/**
 * Expense card - improved hierarchy with "Your share"
 *
 * UX Intent:
 * - Clear visual hierarchy: icon → title → amount
 * - Shows "Your share" as secondary line (personalizes the expense)
 * - Subtle unsettled badge if user hasn't paid their share yet
 * - Soft colors, no harsh contrasts
 * - Clearly tappable with subtle feedback
 * - Opens bottom sheet on click for detailed view
 */
export function RecentExpenseCard({
  id,
  projectId,
  title,
  amount,
  currency,
  paidBy,
  category,
  expenseDate,
  shares = [],
  myParticipantId,
  onClick,
}: RecentExpenseCardProps) {
  const categoryColor = category?.color || '#94A3B8' // Softer default

  // Find user's share
  const myShare = shares.find(s => s.participantId === myParticipantId)
  const myShareAmount = myShare?.amount || 0

  // Check if user needs to settle (they owe money but didn't pay)
  const isUnsettled = myParticipantId &&
    myParticipantId !== paidBy.id &&
    myShareAmount > 0

  return (
    <button
      onClick={onClick}
      className="w-full text-right bg-white dark:bg-gray-900/80 rounded-xl p-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 active:scale-[0.99] transition-all flex items-center gap-3 group border border-gray-100/80 dark:border-gray-800/50 relative"
    >
      {/* Unsettled badge - subtle indicator */}
      {isUnsettled && (
        <div className="absolute top-2.5 left-2.5 w-2 h-2 bg-orange-400 rounded-full ring-2 ring-orange-100 dark:ring-orange-900/50" />
      )}

      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Category Icon - softer, no blur effect */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: categoryColor + '18' }}
        >
          <span className="text-lg">{category?.icon || '📝'}</span>
        </div>

        {/* Details - improved hierarchy */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-gray-800 dark:text-gray-100 text-[15px] leading-tight mb-0.5">
            {title}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {paidBy.name} پرداخت کرد · {new Date(expenseDate).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
          </p>
          {/* Your share - personalized secondary info */}
          {myShareAmount > 0 && (
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 font-medium">
              سهم تو: {formatMoney(myShareAmount, currency)}
            </p>
          )}
        </div>

        {/* Amount - total amount, softer weight */}
        <div className="text-left flex-shrink-0">
          <p className="font-semibold text-gray-700 dark:text-gray-200 text-[15px]">
            {formatMoney(amount, currency)}
          </p>
        </div>
      </div>
    </button>
  )
}
