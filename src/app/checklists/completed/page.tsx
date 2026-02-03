/**
 * Completed Checklists Page (Archive)
 * Display all completed checklists with 100% progress
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import type { Checklist } from '@/types/checklist'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChecklistsResponse {
  checklists: Checklist[]
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getProgressInfo(checklist: Checklist): { completed: number; total: number; percentage: number } {
  const total = checklist.items?.length || 0
  const completed = checklist.items?.filter((i) => i.isChecked).length || 0
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { completed, total, percentage }
}

function isChecklistComplete(checklist: Checklist): boolean {
  const { percentage, total } = getProgressInfo(checklist)
  return total > 0 && percentage === 100
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function CompletedChecklistsPage() {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)

  // ── Fetch Checklists ────────────────────────────────────────
  useEffect(() => {
    async function fetchChecklists() {
      try {
        const res = await fetch('/api/checklists?includeArchived=true')
        if (!res.ok) throw new Error('Failed to fetch checklists')

        const data: ChecklistsResponse = await res.json()
        // Filter only completed checklists (100% progress)
        const completedChecklists = data.checklists.filter(isChecklistComplete)
        setChecklists(completedChecklists)
      } catch (error) {
        console.error('Error fetching checklists:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChecklists()
  }, [])

  // ── Reactivate Checklist (Uncheck all items) ────────────────
  const handleReactivate = async (checklistId: string) => {
    setReactivatingId(checklistId)
    try {
      // Find the checklist
      const checklist = checklists.find((c) => c.id === checklistId)
      if (!checklist) return

      // Uncheck all items
      const uncheckPromises = (checklist.items || []).map((item) =>
        fetch(`/api/checklists/${checklistId}/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isChecked: false }),
        })
      )
      await Promise.all(uncheckPromises)

      // Navigate to the checklist
      router.push(`/checklists/${checklistId}`)
    } catch (error) {
      console.error('Error reactivating checklist:', error)
      alert('خطا در بازگرداندن چک‌لیست')
    } finally {
      setReactivatingId(null)
    }
  }

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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-br from-green-400/15 to-emerald-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/checklists"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              بازگشت
            </Link>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center text-4xl">
              🏆
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              چک‌لیست‌های انجام‌شده
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              اینجا لیست‌هایی هست که با موفقیت تمومشون کردی 👏
            </p>
          </div>
        </div>

        {/* Empty State */}
        {checklists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 flex items-center justify-center text-5xl">
              📋
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              هنوز چک‌لیستی رو کامل نکردی
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              وقتی همه آیتم‌ها انجام بشن، اینجا میاد
            </p>
            <Link href="/checklists">
              <Button
                className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700"
              >
                برگشت به چک‌لیست‌ها
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🎉</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {checklists.length} چک‌لیست تکمیل‌شده
                </span>
              </div>
            </div>

            {/* Completed Checklists */}
            <div className="space-y-4">
              {checklists.map((checklist) => {
                const { total } = getProgressInfo(checklist)

                return (
                  <div
                    key={checklist.id}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-white/50 dark:border-gray-700/50 shadow-md"
                  >
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
                          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg">
                            انجام شد 🎉
                          </span>
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                            {total} مورد
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar (Full) */}
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleReactivate(checklist.id)}
                        disabled={reactivatingId === checklist.id}
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                      >
                        {reactivatingId === checklist.id ? 'در حال بازگردانی...' : 'بازگرداندن به لیست فعال'}
                      </button>
                      <Link href={`/checklists/${checklist.id}`}>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                          مشاهده
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
