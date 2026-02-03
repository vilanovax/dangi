'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'
import { formatMoney } from '@/lib/utils/money'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface RecentSettlementCardProps {
  id: string
  projectId: string
  from: Participant
  to: Participant
  amount: number
  currency: string
  settledAt: string
  reversed?: boolean
  type?: string
}

/**
 * Card showing a recent settlement
 * Links to settlement detail page
 *
 * UX Intent:
 * - Compact, scannable design
 * - Green accent for successful settlements
 * - Subtle hover effect for interactivity
 * - Clear payment direction visualization
 */
export function RecentSettlementCard({
  id,
  projectId,
  from,
  to,
  amount,
  currency,
  settledAt,
  reversed = false,
  type = 'normal',
}: RecentSettlementCardProps) {
  return (
    <Link href={`/project/${projectId}/settlement/${id}`}>
      <div className={`rounded-xl p-3 transition-all active:scale-[0.99] relative ${
        reversed
          ? 'bg-gray-50 dark:bg-gray-800/50'
          : 'bg-gradient-to-r from-green-50/80 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20 hover:from-green-100/80 hover:to-emerald-100/50 dark:hover:from-green-900/40 dark:hover:to-emerald-900/30 border border-green-100/50 dark:border-green-800/30'
      }`}>
        {/* Status Badges */}
        {(reversed || type === 'reverse') && (
          <div className="absolute top-2 left-2 flex gap-1">
            {type === 'reverse' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                معکوس
              </span>
            )}
          </div>
        )}

        {/* Force LTR for payment direction (From → To) to match arrow */}
        <div className="flex items-center gap-2.5" dir="ltr">
          {/* From Avatar */}
          <div className="w-8 h-8 flex-shrink-0">
            <Avatar
              avatar={deserializeAvatar(from.avatar || null, from.name)}
              name={from.name}
              size="sm"
            />
          </div>

          {/* Arrow */}
          <svg
            className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>

          {/* To Avatar */}
          <div className="w-8 h-8 flex-shrink-0">
            <Avatar
              avatar={deserializeAvatar(to.avatar || null, to.name)}
              name={to.name}
              size="sm"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 mr-1">
            <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-200">
              {from.name} به {to.name}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {new Date(settledAt).toLocaleDateString('fa-IR', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Amount */}
          <p className={`font-bold text-sm flex-shrink-0 tabular-nums ${
            reversed
              ? 'text-gray-400 line-through'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {formatMoney(amount, currency)}
          </p>
        </div>
      </div>
    </Link>
  )
}
