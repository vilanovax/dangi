'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { getAggregationCountText } from '@/lib/utils/settlement-aggregation'
import type { Avatar as AvatarData } from '@/lib/types/avatar'
import type { Settlement } from '@/lib/utils/settlement-aggregation'

interface SettlementSuggestionCardProps {
  fromName: string
  fromAvatar: AvatarData | null
  toName: string
  toAvatar: AvatarData | null
  amount: number
  currency: string
  onSettle: () => void
  // UX: Aggregation support
  isAggregated?: boolean
  originalCount?: number
  originalSettlements?: Settlement[]
}

/**
 * Settlement suggestion card with quick settle button
 * Supports both single and aggregated settlements
 *
 * UX: Aggregation reduces cognitive load while maintaining transparency
 */
export function SettlementSuggestionCard({
  fromName,
  fromAvatar,
  toName,
  toAvatar,
  amount,
  currency,
  onSettle,
  isAggregated = false,
  originalCount = 1,
  originalSettlements = [],
}: SettlementSuggestionCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* From Avatar */}
        <div className="w-11 h-11 flex-shrink-0 ring-2 ring-red-100 dark:ring-red-900/50 rounded-full">
          {fromAvatar ? (
            <Avatar avatar={fromAvatar} name={fromName} size="md" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                {fromName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <svg
          className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>

        {/* To Avatar */}
        <div className="w-11 h-11 flex-shrink-0 ring-2 ring-green-100 dark:ring-green-900/50 rounded-full">
          {toAvatar ? (
            <Avatar avatar={toAvatar} name={toName} size="md" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {toName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 mr-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {fromName} به {toName}
          </p>
          <p className="font-bold text-lg text-gray-900 dark:text-white">
            {formatMoney(amount, currency)}
          </p>
          {/* UX: Show aggregation badge for transparency */}
          {isAggregated && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {getAggregationCountText(originalCount)}
            </p>
          )}
        </div>

        {/* Settle Button */}
        <button
          onClick={onSettle}
          className="flex-shrink-0 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          تسویه
        </button>
      </div>

      {/* UX: Expandable details for aggregated settlements (transparency = trust) */}
      {isAggregated && originalSettlements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {showDetails ? '▼' : '◀'} دیدن جزئیات
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                این تسویه‌ها از خرج‌های زیر تشکیل شده:
              </p>
              {originalSettlements.map((s, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex justify-between items-center"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {s.fromName} → {s.toName}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatMoney(s.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
