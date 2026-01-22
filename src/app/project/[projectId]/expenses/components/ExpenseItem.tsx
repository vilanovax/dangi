'use client'

import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'
import { formatPeriodKeyShort } from '@/lib/utils/persian-date'

interface ExpenseItemProps {
  id: string
  projectId: string
  title: string
  amount: number
  currency: string
  payer: {
    name: string
  }
  category?: {
    name: string
    icon: string
    color: string
  } | null
  periodKey?: string | null
  showPeriod?: boolean
}

/**
 * Single expense item in the timeline
 * Clear hierarchy: Title > Amount > Payer > Category
 * Minimal design - no avatar to keep it clean
 * Tappable with subtle hover feedback
 */
export function ExpenseItem({
  id,
  projectId,
  title,
  amount,
  currency,
  payer,
  category,
  periodKey,
  showPeriod = false,
}: ExpenseItemProps) {
  // Category background with subtle opacity
  const categoryBgColor = category?.color
    ? `${category.color}12`
    : 'rgba(107, 114, 128, 0.08)'

  return (
    <Link
      href={`/project/${projectId}/expense/${id}`}
      className="block group"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm group-hover:shadow-md group-active:scale-[0.99] transition-all duration-150">
        <div className="flex items-center gap-3">
          {/* Category Icon - secondary visual element */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: categoryBgColor }}
          >
            <span className="text-xl">{category?.icon || '📝'}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title - primary element */}
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-[15px]">
              {title}
            </h3>

            {/* Payer & Category & Period info - clean text only, no avatar */}
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {payer.name}
              {category && (
                <span className="text-gray-400 dark:text-gray-500">
                  {' '}
                  • {category.name}
                </span>
              )}
              {showPeriod && periodKey && (
                <span className="text-blue-500 dark:text-blue-400 font-medium">
                  {' '}
                  • {formatPeriodKeyShort(periodKey)}
                </span>
              )}
            </p>
          </div>

          {/* Amount - clearly visible but not screaming */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">
              {formatMoney(amount, currency)}
            </p>
            {/* Subtle chevron as tap affordance */}
            <svg
              className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
