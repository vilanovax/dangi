'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'

interface EmptyStateProps {
  type: 'guest' | 'no-projects'
}

/**
 * Modern empty state with glassmorphism and gradient effects
 */
export function EmptyState({ type }: EmptyStateProps) {
  if (type === 'guest') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-purple-500/20 rounded-full blur-2xl animate-pulse delay-300" />
        </div>

        {/* Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2rem] blur-2xl opacity-50 animate-pulse" />
          <div className="relative w-28 h-28 rounded-[2rem] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <span className="text-6xl filter drop-shadow-lg">💰</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
          دنگی
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-10">
          تقسیم هزینه‌ها، ساده و سریع
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-5 w-full max-w-xs mb-12">
          {[
            { icon: '✈️', label: 'سفر', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10' },
            { icon: '🏢', label: 'ساختمان', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10' },
            { icon: '🎉', label: 'دورهمی', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
          ].map((feature, i) => (
            <div key={i} className="text-center group">
              <div className={`relative w-16 h-16 mx-auto mb-2`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity`} />
                <div className={`relative w-full h-full rounded-2xl ${feature.bg} backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-3xl">{feature.icon}</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full max-w-sm space-y-4">
          <Link href="/auth">
            <Button
              className="w-full !bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !shadow-xl !shadow-blue-500/25 hover:!shadow-2xl hover:!shadow-blue-500/30 transition-all duration-300"
              size="lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                ورود / ثبت‌نام
              </span>
            </Button>
          </Link>
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            برای استفاده از دنگی، ابتدا وارد شوید
          </p>
        </div>
      </div>
    )
  }

  // No projects state
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-8 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl blur-xl opacity-30" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-xl">
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
        هنوز پروژه‌ای نداری
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-xs">
        اولین پروژه‌ات رو بساز و شروع کن!
      </p>

      {/* Arrow pointing to button */}
      <div className="mt-8 animate-bounce">
        <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  )
}
