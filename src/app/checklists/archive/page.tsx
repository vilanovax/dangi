/**
 * Archive Page
 * Display all archived checklists with restore/delete actions
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

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ArchivePage() {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Toast Helper ──────────────────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }

  // ── Fetch Archived Checklists ─────────────────────────────────
  useEffect(() => {
    async function fetchChecklists() {
      try {
        const res = await fetch('/api/checklists?includeArchived=true')
        if (!res.ok) throw new Error('Failed to fetch checklists')

        const data: ChecklistsResponse = await res.json()
        // Filter only archived checklists
        const archivedChecklists = data.checklists.filter((c) => c.isArchived)
        setChecklists(archivedChecklists)
      } catch (error) {
        console.error('Error fetching checklists:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChecklists()
  }, [])

  // ── Restore Checklist ─────────────────────────────────────────
  const handleRestore = async (checklistId: string) => {
    setRestoringId(checklistId)
    setActiveMenuId(null)
    try {
      const res = await fetch(`/api/checklists/${checklistId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: false }),
      })

      if (!res.ok) throw new Error('Failed to restore checklist')

      // Remove from local state
      setChecklists((prev) => prev.filter((c) => c.id !== checklistId))
      showToast('چک‌لیست به لیست فعال برگشت ✅')

      // If archive is now empty, redirect after a short delay
      if (checklists.length === 1) {
        setTimeout(() => router.push('/checklists'), 1500)
      }
    } catch (error) {
      console.error('Error restoring checklist:', error)
      showToast('خطا در بازگردانی', 'error')
    } finally {
      setRestoringId(null)
    }
  }

  // ── Delete Checklist Permanently ──────────────────────────────
  const handleDelete = async (checklistId: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/checklists/${checklistId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete checklist')

      // Remove from local state
      setChecklists((prev) => prev.filter((c) => c.id !== checklistId))
      setShowDeleteConfirm(null)
      showToast('چک‌لیست حذف شد')
    } catch (error) {
      console.error('Error deleting checklist:', error)
      showToast('خطا در حذف چک‌لیست', 'error')
    } finally {
      setIsDeleting(false)
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-br from-yellow-400/15 to-amber-500/15 rounded-full blur-3xl" />
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center text-4xl">
              📦
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              چک‌لیست‌های آرشیو شده
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              لیست‌هایی که فعلاً بهشون نیاز نداری، اینجا نگه داشته می‌شن
            </p>
          </div>
        </div>

        {/* Empty State */}
        {checklists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 flex items-center justify-center text-5xl">
              📦
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              آرشیوی نداری
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              چک‌لیست‌هایی که آرشیو کنی، اینجا نمایش داده می‌شن
            </p>
            <Link href="/checklists">
              <Button
                className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700"
              >
                بازگشت به چک‌لیست‌ها
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/50">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">📦</span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {checklists.length} چک‌لیست آرشیو شده
                </span>
              </div>
            </div>

            {/* Archived Checklists */}
            <div className="space-y-4">
              {checklists.map((checklist) => {
                const { completed, total, percentage } = getProgressInfo(checklist)
                const isComplete = percentage === 100

                return (
                  <div
                    key={checklist.id}
                    className="relative opacity-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-white/50 dark:border-gray-700/50 shadow-md"
                  >
                    {/* Archive Badge */}
                    <div className="absolute -top-2 right-4 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full shadow-sm">
                      آرشیو شده
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
                          {isComplete ? (
                            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg">
                              انجام شد 🎉
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                              {completed} از {total} انجام شده
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Overflow Menu Button */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === checklist.id ? null : checklist.id)}
                          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === checklist.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute left-0 top-full mt-2 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl p-2 shadow-xl border border-white/50 dark:border-gray-700/50 min-w-[180px]">
                              <button
                                onClick={() => handleRestore(checklist.id)}
                                disabled={restoringId === checklist.id}
                                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <span>📤</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {restoringId === checklist.id ? 'در حال بازگردانی...' : 'بازگرداندن به لیست فعال'}
                                </span>
                              </button>
                              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(checklist.id)
                                  setActiveMenuId(null)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <span>🗑️</span>
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                  حذف برای همیشه
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : 'bg-gradient-to-r from-amber-500 to-orange-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* View Link */}
                    <div className="flex items-center justify-end">
                      <Link href={`/checklists/${checklist.id}`}>
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-3xl">
                🗑️
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                حذف چک‌لیست؟
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                این چک‌لیست برای همیشه حذف می‌شود
                <br />
                و قابل بازگردانی نیست
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'در حال حذف...' : 'حذف برای همیشه'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div
            className={`rounded-xl px-4 py-3 shadow-xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </main>
  )
}
