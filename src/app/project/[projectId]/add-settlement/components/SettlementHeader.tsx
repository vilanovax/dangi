'use client'

import { Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface SettlementHeaderProps {
  projectName: string
  from: Participant | null
  to: Participant | null
  amount: number | null
  currency: string
  onBack: () => void
  onSwap: () => void
}

/**
 * Green gradient header for settlement page
 * Shows transfer preview with swap button
 */
export function SettlementHeader({
  projectName,
  from,
  to,
  amount,
  currency,
  onBack,
  onSwap,
}: SettlementHeaderProps) {
  return (
    <div className="sticky top-0 z-10">
      <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white px-4 pt-4 pb-5">
        {/* Top Row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 -mr-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">ثبت تسویه حساب</h1>
            <p className="text-green-100 text-sm">{projectName}</p>
          </div>
        </div>

        {/* Transfer Preview Card */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            {/* From */}
            <div className="flex-1 text-center">
              <p className="text-green-100 text-[10px] mb-1.5 font-medium">پرداخت‌کننده</p>
              {from ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 ring-2 ring-white/30 rounded-full">
                    <Avatar
                      avatar={deserializeAvatar(from.avatar || null, from.name)}
                      name={from.name}
                      size="lg"
                    />
                  </div>
                  <span className="text-xs font-medium">{from.name}</span>
                </div>
              ) : (
                <div className="w-12 h-12 mx-auto rounded-full bg-white/20 animate-pulse" />
              )}
            </div>

            {/* Arrow + Swap */}
            <div className="flex flex-col items-center gap-1 px-2">
              <button
                onClick={onSwap}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
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
              <span className="text-[10px] text-green-100">جابجایی</span>
            </div>

            {/* To */}
            <div className="flex-1 text-center">
              <p className="text-green-100 text-[10px] mb-1.5 font-medium">دریافت‌کننده</p>
              {to ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 ring-2 ring-white/30 rounded-full">
                    <Avatar
                      avatar={deserializeAvatar(to.avatar || null, to.name)}
                      name={to.name}
                      size="lg"
                    />
                  </div>
                  <span className="text-xs font-medium">{to.name}</span>
                </div>
              ) : (
                <div className="w-12 h-12 mx-auto rounded-full bg-white/20 animate-pulse" />
              )}
            </div>
          </div>

          {/* Amount Preview */}
          {amount && amount > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 text-center">
              <p className="text-xl font-bold">{formatMoney(amount, currency)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
