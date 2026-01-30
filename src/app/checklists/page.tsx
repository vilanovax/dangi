/**
 * Checklists List Page
 * Display all user checklists with filtering and archive support
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import type { Checklist } from '@/types/checklist'
import type { ChecklistCategoryId } from '@/lib/domain/checklist-templates/types'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChecklistsResponse {
  checklists: Checklist[]
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getProgressPercentage(checklist: Checklist): number {
  if (!checklist.items || checklist.items.length === 0) return 0
  const checked = checklist.items.filter((i) => i.isChecked).length
  return Math.round((checked / checklist.items.length) * 100)
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ChecklistsPage() {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategoryId | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ── Fetch Checklists ────────────────────────────────────────
  useEffect(() => {
    async function fetchChecklists() {
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'all') params.set('category', selectedCategory)
        params.set('includeArchived', 'true') // Always fetch all, filter client-side

        const res = await fetch(`/api/checklists?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch checklists')

        const data: ChecklistsResponse = await res.json()
        setChecklists(data.checklists)
      } catch (error) {
        console.error('Error fetching checklists:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChecklists()
  }, [selectedCategory])

  // ── Filter Checklists ───────────────────────────────────────
  const activeChecklists = checklists.filter((c) => !c.isArchived)
  const archivedChecklists = checklists.filter((c) => c.isArchived)

  // ── Loading State ───────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── Main Render ─────────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5 pb-28">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                ✅ چک‌لیست‌ها
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                مدیریت کارها و خریدهای خود
              </p>
            </div>
            <Link href="/">
              <button className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl flex items-center justify-center hover:shadow-md transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </Link>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setSelectedCategory('travel')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'travel'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              ✈️ سفر
            </button>
            <button
              onClick={() => setSelectedCategory('gathering')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'gathering'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              🎉 دورهمی
            </button>
            <button
              onClick={() => setSelectedCategory('personal-finance')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'personal-finance'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              💰 خرج شخصی
            </button>
          </div>
        </div>

        {/* Empty State */}
        {activeChecklists.length === 0 && archivedChecklists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center text-5xl">
              📝
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              هنوز چک‌لیستی ندارید
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              چک‌لیست برای مدیریت کارها و خریدهای خود بسازید
            </p>
            <Link href="/checklists/new">
              <Button
                className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700"
                size="lg"
              >
                ایجاد اولین چک‌لیست
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Active Checklists */}
            {activeChecklists.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                  <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                    چک‌لیست‌های فعال
                  </h2>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    {activeChecklists.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {activeChecklists.map((checklist) => {
                    const progress = getProgressPercentage(checklist)
                    return (
                      <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 hover:shadow-xl transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02]">
                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                              style={{ backgroundColor: `${checklist.color}20` }}
                            >
                              {checklist.icon || '📋'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                                {checklist.title}
                              </h3>
                              {checklist.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {checklist.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                                  {checklist.items?.length || 0} مورد
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                پیشرفت
                              </span>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Archived Checklists */}
            {archivedChecklists.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-3 mb-4 group"
                >
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                  <h2 className="text-base font-bold text-gray-500 dark:text-gray-400">
                    آرشیو شده
                  </h2>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                    {archivedChecklists.length}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showArchived ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showArchived && (
                  <div className="space-y-4">
                    {archivedChecklists.map((checklist) => {
                      const progress = getProgressPercentage(checklist)
                      return (
                        <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
                          <div className="relative opacity-75 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 hover:shadow-xl transition-all border border-white/50 dark:border-gray-700/50">
                            {/* Archive Badge */}
                            <div className="absolute -top-2 right-4 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full shadow-sm">
                              📦 آرشیو شده
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                              <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                                style={{ backgroundColor: `${checklist.color}20` }}
                              >
                                {checklist.icon || '📋'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                                  {checklist.title}
                                </h3>
                                {checklist.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {checklist.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                                    {checklist.items?.length || 0} مورد
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  پیشرفت
                                </span>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {progress}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Create Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent pt-10">
        <Link href="/checklists/new">
          <Button
            className="w-full !bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !shadow-xl !shadow-blue-500/25"
            size="lg"
          >
            <span className="flex items-center justify-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="font-bold">ایجاد چک‌لیست جدید</span>
            </span>
          </Button>
        </Link>
      </div>
    </main>
  )
}
