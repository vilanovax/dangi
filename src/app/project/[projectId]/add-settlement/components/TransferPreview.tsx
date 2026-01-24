'use client'

import { Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface TransferPreviewProps {
  from: Participant | null
  to: Participant | null
  amount: number | null
  currency: string
  onSwap: () => void
}

/**
 * Transfer Preview Card - Shows payer → receiver with amount
 * Used as hero section in settlement form
 */
export function TransferPreview({
  from,
  to,
  amount,
  currency,
  onSwap,
}: TransferPreviewProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-4">
      <div className="bg-white dark:bg-gray-900/80 rounded-2xl p-4 border border-green-100 dark:border-green-800/30 shadow-sm">
        <div className="flex items-center justify-between">
          {/* From */}
          <div className="flex-1 text-center">
            <p className="text-green-600 dark:text-green-400 text-[10px] mb-1.5 font-medium">
              پرداخت‌کننده
            </p>
            {from ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 ring-2 ring-green-200 dark:ring-green-700 rounded-full">
                  <Avatar
                    avatar={deserializeAvatar(from.avatar || null, from.name)}
                    name={from.name}
                    size="lg"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {from.name}
                </span>
              </div>
            ) : (
              <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 animate-pulse" />
            )}
          </div>

          {/* Arrow + Swap */}
          <div className="flex flex-col items-center gap-1 px-2">
            <button
              onClick={onSwap}
              className="p-2.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50 active:scale-95 transition-all"
              title="جابجایی"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
            <span className="text-[10px] text-green-600 dark:text-green-400">جابجایی</span>
          </div>

          {/* To */}
          <div className="flex-1 text-center">
            <p className="text-green-600 dark:text-green-400 text-[10px] mb-1.5 font-medium">
              دریافت‌کننده
            </p>
            {to ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 ring-2 ring-green-200 dark:ring-green-700 rounded-full">
                  <Avatar
                    avatar={deserializeAvatar(to.avatar || null, to.name)}
                    name={to.name}
                    size="lg"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {to.name}
                </span>
              </div>
            ) : (
              <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 animate-pulse" />
            )}
          </div>
        </div>

        {/* Amount Preview */}
        {amount && amount > 0 && (
          <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800/30 text-center">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatMoney(amount, currency)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
