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
}

/**
 * Card showing a recent settlement
 * Links to settlement detail page
 */
export function RecentSettlementCard({
  id,
  projectId,
  from,
  to,
  amount,
  currency,
  settledAt,
}: RecentSettlementCardProps) {
  return (
    <Link href={`/project/${projectId}/settlement/${id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          {/* From Avatar */}
          <div className="w-9 h-9 flex-shrink-0">
            <Avatar
              avatar={deserializeAvatar(from.avatar || null, from.name)}
              name={from.name}
              size="sm"
            />
          </div>

          {/* Arrow */}
          <svg
            className="w-5 h-5 text-green-500 flex-shrink-0"
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
          <div className="w-9 h-9 flex-shrink-0">
            <Avatar
              avatar={deserializeAvatar(to.avatar || null, to.name)}
              name={to.name}
              size="sm"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 mr-1">
            <p className="font-medium text-sm truncate">
              {from.name} به {to.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(settledAt).toLocaleDateString('fa-IR', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Amount */}
          <p className="font-bold text-sm text-green-600 dark:text-green-400 flex-shrink-0">
            {formatMoney(amount, currency)}
          </p>
        </div>
      </div>
    </Link>
  )
}
