'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UnifiedHeader } from '@/components/layout'
import { formatMoney } from '@/lib/utils/money'

interface DashboardHeaderProps {
  projectId: string
  projectName: string
  participantCount: number
  totalExpenses: number
  currency: string
  /** User's current balance (positive = creditor, negative = debtor) */
  myBalance?: number
}

/**
 * Travel dashboard header - gradient with total and balance micro-summary
 *
 * UX Intent:
 * - Project name as hero
 * - Total expenses as primary visual element (large, prominent)
 * - User balance status as secondary micro-summary (creditor/debtor/settled)
 * - Clear typography hierarchy: amount > label > balance status
 * - Sky blue gradients for travel/journey vibe
 * - Tappable total card links to summary
 */
export function DashboardHeader({
  projectId,
  projectName,
  participantCount,
  totalExpenses,
  currency,
  myBalance = 0,
}: DashboardHeaderProps) {
  const router = useRouter()

  // Determine balance status with friendly Persian microcopy
  const getBalanceStatus = () => {
    const absBalance = Math.abs(myBalance)
    if (absBalance < 1) {
      return { text: 'تسویه هستی ✓', color: 'text-white/60' }
    }
    if (myBalance > 0) {
      return {
        text: `${formatMoney(absBalance, currency)} بهت بدهکارن`,
        color: 'text-emerald-300/90',
      }
    }
    return {
      text: `${formatMoney(absBalance, currency)} بدهکاری`,
      color: 'text-orange-300/90',
    }
  }

  const balanceStatus = getBalanceStatus()

  return (
    <UnifiedHeader
      variant="travel"
      title={projectName}
      projectMeta={{ membersCount: participantCount }}
      showBack
      onBack={() => router.push('/')}
      rightAction={
        <Link
          href={`/project/${projectId}/settings`}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          aria-label="تنظیمات"
        >
          <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      }
    >
      {/* Total Card - Improved hierarchy with balance micro-summary */}
      <Link href={`/project/${projectId}/summary`} className="block">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/15 active:scale-[0.99] transition-all border border-white/20">
          {/* Label - Small, secondary */}
          <p className="text-xs text-white/70 font-medium mb-1">
            مجموع خرج‌ها
          </p>

          {/* Amount - Large, primary visual element */}
          <p className="text-3xl font-bold text-white mb-2">
            {formatMoney(totalExpenses, currency)}
          </p>

          {/* Balance Status - Micro-summary, tertiary */}
          <p className={`text-xs font-medium ${balanceStatus.color}`}>
            {balanceStatus.text}
          </p>
        </div>
      </Link>
    </UnifiedHeader>
  )
}
