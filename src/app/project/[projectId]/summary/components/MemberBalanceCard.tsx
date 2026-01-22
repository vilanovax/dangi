'use client'

import { Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import type { Avatar as AvatarData } from '@/lib/types/avatar'

interface MemberBalanceCardProps {
  name: string
  avatar: AvatarData | null
  totalPaid: number
  totalShare: number
  balance: number
  currency: string
}

/**
 * Individual member balance card
 * Shows paid amount, share, and final balance status
 */
export function MemberBalanceCard({
  name,
  avatar,
  totalPaid,
  totalShare,
  balance,
  currency,
}: MemberBalanceCardProps) {
  const isCreditor = balance > 0
  const isDebtor = balance < 0
  const isSettled = balance === 0

  // Border color based on status
  const borderColor = isCreditor
    ? 'border-r-green-500'
    : isDebtor
    ? 'border-r-red-400'
    : 'border-r-gray-300'

  // Status label
  const statusLabel = isCreditor ? 'طلبکار' : isDebtor ? 'بدهکار' : 'تسویه'
  const statusColor = isCreditor
    ? 'text-green-600 dark:text-green-400'
    : isDebtor
    ? 'text-red-500 dark:text-red-400'
    : 'text-gray-500'

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border-r-4 ${borderColor}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 flex-shrink-0">
          {avatar ? (
            <Avatar avatar={avatar} name={name} size="lg" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="font-semibold text-lg text-gray-600 dark:text-gray-300">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>پرداخت: {formatMoney(totalPaid, currency)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>سهم: {formatMoney(totalShare, currency)}</span>
          </div>
        </div>

        {/* Balance */}
        <div className="text-left flex-shrink-0">
          <p className={`font-bold text-lg ${statusColor}`}>
            {isCreditor ? '+' : ''}
            {formatMoney(balance, currency)}
          </p>
          <p className={`text-xs ${statusColor}`}>{statusLabel}</p>
        </div>
      </div>
    </div>
  )
}
