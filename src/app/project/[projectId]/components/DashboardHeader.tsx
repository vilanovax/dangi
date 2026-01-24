'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UnifiedHeader, HeaderBadge, HeaderTotalCard } from '@/components/layout'

interface DashboardHeaderProps {
  projectId: string
  projectName: string
  participantCount: number
  totalExpenses: number
  currency: string
}

/**
 * Travel dashboard header - uses UnifiedHeader with variant="project"
 *
 * UX Intent:
 * - Project name as hero, not total amount
 * - Total expenses shown contextually with helper text
 * - Soft gradients and rounded shapes for travel vibe
 * - Tappable total card links to summary
 */
export function DashboardHeader({
  projectId,
  projectName,
  participantCount,
  totalExpenses,
  currency,
}: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <UnifiedHeader
      variant="project"
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
      {/* Total Card - Tappable, links to summary */}
      <Link href={`/project/${projectId}/summary`}>
        <HeaderTotalCard
          label="مجموع خرج‌ها"
          amount={totalExpenses}
          currency={currency}
          helperText="تا این لحظه"
          onClick={() => {}}
        />
      </Link>
    </UnifiedHeader>
  )
}
