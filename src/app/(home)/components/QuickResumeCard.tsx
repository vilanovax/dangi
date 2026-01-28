'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TemplateType = 'travel' | 'gathering' | 'personal' | 'building' | 'family'
type StatusType = 'settled' | 'debt' | 'credit' | 'active'

interface QuickResumeCardProps {
  projectId: string
  title: string
  templateType: TemplateType
  templateIcon: string
  status: StatusType
  participantCount?: number
  userBalance?: number
  onDismiss?: () => void
}

/**
 * Quick Resume Card - Smart project continuation
 *
 * UX Philosophy:
 * "اپ می‌دونه تو چی می‌خوای، قبل از اینکه بگی"
 * - The app anticipates your needs
 * - Feels like a smart assistant, not just a feature
 * - Reduces friction: Jump directly to last active project
 *
 * UX Intent:
 * - Smart & personal: "دفعه قبل اینجا بودی 👀"
 * - Template-aware: Gradient matches project type
 * - Status-first: Clear project state at a glance
 * - Friendly tone: Non-accounting language
 *
 * Design Hierarchy:
 * 1. "دفعه قبل اینجا بودی 👀" label (smart context)
 * 2. Project title (what)
 * 3. Status (current state)
 * 4. CTA "ادامه بده →" (seamless action)
 */
export function QuickResumeCard({
  projectId,
  title,
  templateType,
  templateIcon,
  status,
  participantCount,
  onDismiss,
}: QuickResumeCardProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  // Template-based gradient mapping (matching ProjectCard)
  const getTemplateGradient = () => {
    const gradients: Record<TemplateType, string> = {
      travel: 'from-sky-400/15 via-blue-500/15 to-cyan-500/15',
      building: 'from-purple-400/15 via-pink-500/15 to-rose-500/15',
      gathering: 'from-amber-400/15 via-orange-500/15 to-yellow-500/15',
      personal: 'from-emerald-400/15 via-teal-500/15 to-cyan-500/15',
      family: 'from-amber-400/15 via-orange-500/15 to-red-500/15',
    }
    return gradients[templateType] || gradients.travel
  }

  // Template-based accent color
  const getAccentColor = () => {
    const colors: Record<TemplateType, string> = {
      travel: 'from-sky-500 to-blue-600',
      building: 'from-purple-500 to-pink-600',
      gathering: 'from-amber-500 to-orange-600',
      personal: 'from-emerald-500 to-teal-600',
      family: 'from-amber-500 to-orange-600',
    }
    return colors[templateType] || colors.travel
  }

  // Status rendering with friendly text
  const renderStatus = () => {
    switch (status) {
      case 'settled':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-green-500/15 border border-emerald-500/20">
            <span className="text-base">🟢</span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">حساب صافه</span>
          </div>
        )
      case 'debt':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500/15 to-rose-500/15 border border-red-500/20">
            <span className="text-base">🔴</span>
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">بدهکاری داری</span>
          </div>
        )
      case 'credit':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/20">
            <span className="text-base">🟢</span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">طلبکاری</span>
          </div>
        )
      case 'active':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/20">
            <span className="text-base">🟡</span>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">در جریان</span>
          </div>
        )
    }
  }

  const handleContinue = () => {
    setIsAnimating(true)
    setTimeout(() => {
      router.push(`/project/${projectId}`)
    }, 150)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div
      className={`mb-5 animate-in fade-in slide-in-from-top-2 duration-500 ${
        isAnimating ? 'scale-[0.98]' : ''
      } transition-transform duration-150`}
    >
      {/* "دفعه قبل اینجا بودی" Badge - Smart & Personal */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            دفعه قبل اینجا بودی 👀
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="بستن"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Card */}
      <button
        onClick={handleContinue}
        className={`w-full text-right relative overflow-hidden bg-gradient-to-br ${getTemplateGradient()} bg-white dark:bg-gray-900 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 active:scale-[0.98] border-2 border-white/50 dark:border-gray-800/50 group`}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/30 to-transparent dark:from-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Top Row: Title + Template Icon */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                {title}
              </h3>
              {participantCount && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{participantCount} نفر</span>
                </div>
              )}
            </div>

            {/* Template Icon Badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 flex items-center justify-center shadow-md">
              <span className="text-3xl">{templateIcon}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            {renderStatus()}
          </div>

          {/* CTA Button */}
          <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r ${getAccentColor()} shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
            <span className="text-base font-bold text-white">ادامه بده</span>
            <svg className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  )
}
