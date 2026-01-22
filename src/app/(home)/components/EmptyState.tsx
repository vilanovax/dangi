'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'

interface EmptyStateProps {
  type: 'guest' | 'no-projects'
}

/**
 * Empty state for home page
 * Shows different content for guests vs logged-in users with no projects
 */
export function EmptyState({ type }: EmptyStateProps) {
  if (type === 'guest') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/25">
          <span className="text-5xl">💰</span>
        </div>

        <h1 className="text-3xl font-black mb-2">دنگی</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">تقسیم هزینه‌ها، ساده و سریع</p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-xs mb-10">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">✈️</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">سفر</span>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🏢</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">ساختمان</span>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🎉</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">دورهمی</span>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full max-w-sm space-y-3">
          <Link href="/auth">
            <Button className="w-full" size="lg">
              ورود / ثبت‌نام
            </Button>
          </Link>
          <p className="text-xs text-gray-400 text-center">
            برای استفاده از دنگی، ابتدا وارد شوید
          </p>
        </div>
      </div>
    )
  }

  // No projects state
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <span className="text-4xl">📋</span>
      </div>
      <h2 className="text-xl font-bold mb-2">هنوز پروژه‌ای نداری</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-2">
        اولین پروژه‌ات رو بساز و شروع کن!
      </p>
    </div>
  )
}
