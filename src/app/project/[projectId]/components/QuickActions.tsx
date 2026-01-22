'use client'

import Link from 'next/link'
import { Card } from '@/components/ui'

interface QuickActionsProps {
  projectId: string
}

/**
 * Quick action buttons card
 * Links to expenses, summary and add settlement
 */
export function QuickActions({ projectId }: QuickActionsProps) {
  return (
    <div className="px-4 -mt-4">
      <Card className="flex gap-2 p-2">
        <Link
          href={`/project/${projectId}/expenses`}
          className="flex-1 py-3 text-center rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>هزینه‌ها</span>
          </div>
        </Link>

        <Link
          href={`/project/${projectId}/summary`}
          className="flex-1 py-3 text-center rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <svg
              className="w-5 h-5 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>خلاصه حساب</span>
          </div>
        </Link>

        <Link
          href={`/project/${projectId}/add-settlement`}
          className="flex-1 py-3 text-center rounded-xl bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 text-sm font-medium transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>ثبت تسویه</span>
          </div>
        </Link>
      </Card>
    </div>
  )
}
