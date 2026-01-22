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
 * Card showing a recent expense
 * Links to expense detail page
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
  return (
    <Link href={`/project/${projectId}/expense/${id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
        {/* Category Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: (category?.color || '#6B7280') + '20' }}
        >
          <span className="text-lg">{category?.icon || '📝'}</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {paidBy.name} پرداخت کرد
          </p>
        </div>

        {/* Amount */}
        <div className="text-left flex-shrink-0">
          <p className="font-bold text-sm">{formatMoney(amount, currency)}</p>
          <p className="text-[10px] text-gray-400">
            {new Date(expenseDate).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </Link>
  )
}
