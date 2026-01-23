'use client'

import Link from 'next/link'
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

interface RecentExpenseCardProps {
  id: string
  projectId: string
  title: string
  amount: number
  currency: string
  paidBy: Participant
  category?: Category
  expenseDate: string
}

/**
 * Expense card - clean and friendly
 *
 * UX Intent:
 * - Clear visual hierarchy: icon → title → amount
 * - Soft colors, no harsh contrasts
 * - Clearly tappable with subtle feedback
 * - "پرداخت کرد" feels conversational, not transactional
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
}: RecentExpenseCardProps) {
  const categoryColor = category?.color || '#94A3B8' // Softer default

  return (
    <Link href={`/project/${projectId}/expense/${id}`}>
      <div className="bg-white dark:bg-gray-900/80 rounded-xl p-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 active:scale-[0.99] transition-all flex items-center gap-3 group border border-gray-100/80 dark:border-gray-800/50">
        {/* Category Icon - softer, no blur effect */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: categoryColor + '18' }}
        >
          <span className="text-lg">{category?.icon || '📝'}</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-gray-800 dark:text-gray-100 text-[15px]">
            {title}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {paidBy.name} پرداخت کرد · {new Date(expenseDate).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Amount - softer weight */}
        <div className="text-left flex-shrink-0">
          <p className="font-semibold text-gray-700 dark:text-gray-200 text-[15px]">
            {formatMoney(amount, currency)}
          </p>
        </div>
      </div>
    </Link>
  )
}
