'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatMoney } from '@/lib/utils/money'

interface DashboardHeaderProps {
  projectId: string
  projectName: string
  participantCount: number
  totalExpenses: number
  currency: string
}

/**
 * Travel dashboard header with calming aesthetic
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
    <div className="relative overflow-hidden">
      {/* Softer gradient background - travel vibes */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500" />

      {/* Decorative elements - softer, more organic */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-sky-300/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-indigo-300/15 rounded-full blur-xl" />

      <div className="relative text-white px-4 pt-4 pb-8">
        {/* Top Row - Navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
            aria-label="بازگشت به خانه"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Participant count - friendly badge */}
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-base">👥</span>
            <span className="text-sm font-medium">{participantCount} هم‌سفر</span>
          </div>

          {/* Settings - De-emphasized, smaller and lighter */}
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
        </div>

        {/* Project Name - Hero element */}
        <h1 className="text-2xl font-bold mb-4 text-center">{projectName}</h1>

        {/* Total Card - Tappable, links to summary */}
        <Link href={`/project/${projectId}/summary`}>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 active:scale-[0.99] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-sm mb-1">مجموع خرج‌ها</p>
                <p className="text-2xl font-bold tracking-tight">{formatMoney(totalExpenses, currency)}</p>
                {/* Helper text - reduces pressure */}
                <p className="text-sky-200/70 text-xs mt-1">تا این لحظه</p>
              </div>
              {/* Visual hint that it's tappable */}
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-sky-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Wave bottom - softer curve */}
      <svg className="absolute bottom-0 left-0 right-0 text-gray-50 dark:text-gray-950" viewBox="0 0 1440 56" fill="currentColor" preserveAspectRatio="none">
        <path d="M0,56 L1440,56 L1440,0 C1200,48 960,56 720,40 C480,24 240,16 0,32 L0,56 Z" />
      </svg>
    </div>
  )
}
