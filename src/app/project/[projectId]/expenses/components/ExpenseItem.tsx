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
 *
 * UX Intent:
 * - Entire card clearly tappable
 * - Title > Amount > Meta hierarchy
 * - Press feedback makes tap action obvious
 * - Chevron slightly more visible as affordance
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
  // Category background - slightly more vibrant
  const categoryBgColor = category?.color
    ? `${category.color}18`
    : 'rgba(107, 114, 128, 0.1)'

  return (
    <Link
      href={`/project/${projectId}/expense/${id}`}
      className="block group"
    >
      {/* Card with clear tap affordance and feedback */}
      <div className="bg-white dark:bg-gray-900/80 rounded-xl p-3.5 border border-gray-100/80 dark:border-gray-800/50 group-hover:bg-gray-50 dark:group-hover:bg-gray-900 group-active:scale-[0.98] group-active:bg-gray-100 dark:group-active:bg-gray-800 transition-all duration-150">
        <div className="flex items-center gap-3">
          {/* Category Icon - more vibrant background */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: categoryBgColor }}
          >
            <span className="text-xl">{category?.icon || '📝'}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title - primary, slightly bolder */}
            <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-[15px]">
              {title}
            </h3>

            {/* Payer & Category - secondary, smaller */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {payer.name}
              {category && (
                <span className="text-gray-400/80 dark:text-gray-600">
                  {' '}• {category.name}
                </span>
              )}
              {showPeriod && periodKey && (
                <span className="text-blue-500/80 dark:text-blue-400/80 font-medium">
                  {' '}• {formatPeriodKeyShort(periodKey)}
                </span>
              )}
            </p>
          </div>

          {/* Amount - lighter weight, readable */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="font-semibold text-gray-700 dark:text-gray-200 text-[15px]">
              {formatMoney(amount, currency)}
            </p>
            {/* Chevron - more visible tap affordance */}
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"
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
