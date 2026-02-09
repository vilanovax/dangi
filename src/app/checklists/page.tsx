/**
 * Checklists List Page
 * Display all user checklists with filtering and archive support
 */

'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, BottomSheet } from '@/components/ui'
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

function sortChecklistsByPriority(checklists: Checklist[]): Checklist[] {
  return [...checklists].sort((a, b) => {
    // Pinned checklists always come first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    // Among pinned, sort by pinnedAt (most recent first)
    if (a.isPinned && b.isPinned) {
      const pinnedAtA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
      const pinnedAtB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
      return pinnedAtB - pinnedAtA
    }

    const progressA = getProgressInfo(a)
    const progressB = getProgressInfo(b)

    // In-progress (0% < progress < 100%) come first
    const isInProgressA = progressA.percentage > 0 && progressA.percentage < 100
    const isInProgressB = progressB.percentage > 0 && progressB.percentage < 100

    if (isInProgressA && !isInProgressB) return -1
    if (!isInProgressA && isInProgressB) return 1

    // Then sort by recently updated
    const dateA = new Date(a.updatedAt || a.createdAt).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt).getTime()
    return dateB - dateA
  })
}

// ─────────────────────────────────────────────────────────────
// Main Component (with Suspense boundary)
// ─────────────────────────────────────────────────────────────

export default function ChecklistsPage() {
  return (
    <Suspense fallback={<ChecklistsPageSkeleton />}>
      <ChecklistsPageContent />
    </Suspense>
  )
}

function ChecklistsPageSkeleton() {
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

function ChecklistsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── State ───────────────────────────────────────────────────
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategoryId | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [pinningId, setPinningId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Long press state
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef(false)

  // ── Check for saved feedback ────────────────────────────────
  useEffect(() => {
    if (searchParams.get('saved') === 'true') {
      setShowSavedToast(true)
      // Remove the param from URL
      router.replace('/checklists', { scroll: false })
      setTimeout(() => setShowSavedToast(false), 2000)
    }
  }, [searchParams, router])

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

  // ── Long Press Handlers ──────────────────────────────────────
  const handlePointerDown = useCallback((checklist: Checklist, e: React.PointerEvent) => {
    // Only trigger for non-button interactions
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return
    }

    e.preventDefault()
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setSelectedChecklist(checklist)
      setShowMenu(true)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }, [])

  const handlePointerUp = useCallback((checklistId: string, e: React.PointerEvent) => {
    // Only trigger for non-button interactions
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }

    setTimeout(() => {
      router.push(`/checklists/${checklistId}`)
    }, 10)
  }, [router])

  const handlePointerMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // ── Action Handlers ────────────────────────────────────────────
  const refetch = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    params.set('includeArchived', 'true')

    const res = await fetch(`/api/checklists?${params.toString()}`)
    if (res.ok) {
      const data: ChecklistsResponse = await res.json()
      setChecklists(data.checklists)
    }
  }, [selectedCategory])

  const handleDuplicate = useCallback(async () => {
    if (!selectedChecklist) return

    setIsDuplicating(true)
    setShowMenu(false)
    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${selectedChecklist.title} (کپی)`,
          description: selectedChecklist.description,
          icon: selectedChecklist.icon,
          color: selectedChecklist.color,
          category: selectedChecklist.category,
          items: (selectedChecklist.items || []).map(item => ({
            text: item.text,
            note: item.note,
          })),
        }),
      })

      if (!res.ok) throw new Error('Failed to duplicate checklist')

      await refetch()
      setSelectedChecklist(null)
      setToast({ message: 'چک‌لیست کپی شد ✅', type: 'success' })
      setTimeout(() => setToast(null), 2500)
    } catch (error) {
      console.error('Error duplicating checklist:', error)
      setToast({ message: 'خطا در کپی کردن', type: 'error' })
      setTimeout(() => setToast(null), 2500)
    } finally {
      setIsDuplicating(false)
    }
  }, [selectedChecklist, refetch])

  const handleArchive = useCallback(async () => {
    if (!selectedChecklist) return

    setIsArchiving(true)
    setShowMenu(false)
    try {
      const res = await fetch(`/api/checklists/${selectedChecklist.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: true }),
      })

      if (!res.ok) throw new Error('Failed to archive checklist')

      await refetch()
      setSelectedChecklist(null)
      setToast({ message: 'آرشیو شد 📦', type: 'success' })
      setTimeout(() => setToast(null), 2500)
    } catch (error) {
      console.error('Error archiving checklist:', error)
      setToast({ message: 'خطا در آرشیو کردن', type: 'error' })
      setTimeout(() => setToast(null), 2500)
    } finally {
      setIsArchiving(false)
    }
  }, [selectedChecklist, refetch])

  const handleDelete = useCallback(async () => {
    if (!selectedChecklist) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/checklists/${selectedChecklist.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete checklist')

      setShowDeleteConfirm(false)
      setShowMenu(false)
      await refetch()
      setSelectedChecklist(null)
      setToast({ message: 'حذف شد 🗑️', type: 'success' })
      setTimeout(() => setToast(null), 2500)
    } catch (error) {
      console.error('Error deleting checklist:', error)
      setToast({ message: 'خطا در حذف', type: 'error' })
      setTimeout(() => setToast(null), 2500)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedChecklist, refetch])

  // ── Pin/Unpin Handler ─────────────────────────────────────────
  const handleTogglePin = async (e: React.MouseEvent, checklistId: string, currentlyPinned: boolean) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()

    if (pinningId) return // Prevent double-clicks

    setPinningId(checklistId)

    try {
      const res = await fetch(`/api/checklists/${checklistId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: !currentlyPinned }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'MAX_PINNED') {
          setToast({ message: 'حداکثر ۳ چک‌لیست می‌تونی سنجاق کنی', type: 'error' })
        } else {
          setToast({ message: 'خطا در سنجاق کردن', type: 'error' })
        }
        return
      }

      // Update local state
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? { ...c, isPinned: !currentlyPinned, pinnedAt: !currentlyPinned ? new Date().toISOString() : null }
            : c
        )
      )

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10)

      // Show toast
      setToast({
        message: !currentlyPinned ? 'به بالای لیست منتقل شد ⭐' : 'از سنجاق‌ها برداشته شد',
        type: 'success',
      })
    } catch (error) {
      console.error('Error pinning checklist:', error)
      setToast({ message: 'خطا در سنجاق کردن', type: 'error' })
    } finally {
      setPinningId(null)
      setTimeout(() => setToast(null), 2500)
    }
  }

  // ── Filter & Sort Checklists ──────────────────────────────────
  // Filter out completed (100%) checklists - they go to the completed page
  const activeChecklists = sortChecklistsByPriority(
    checklists.filter((c) => !c.isArchived && !isChecklistComplete(c))
  )
  const completedChecklists = checklists.filter((c) => !c.isArchived && isChecklistComplete(c))
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
        {activeChecklists.length === 0 && completedChecklists.length === 0 && archivedChecklists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center text-5xl">
              📝
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              هنوز چک‌لیستی نساختی
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              با تمپلیت‌های آماده یا از صفر شروع کن
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
                    {activeChecklists.length} چک‌لیست فعال داری
                  </h2>
                </div>

                <div className="space-y-4">
                  {activeChecklists.map((checklist) => {
                    const { completed, total, percentage } = getProgressInfo(checklist)
                    const isComplete = percentage === 100
                    const isNotStarted = percentage === 0 && total > 0
                    const isPinning = pinningId === checklist.id

                    return (
                      <div
                        key={checklist.id}
                        onPointerDown={(e) => handlePointerDown(checklist, e)}
                        onPointerUp={(e) => handlePointerUp(checklist.id, e)}
                        onPointerMove={handlePointerMove}
                        className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 hover:shadow-xl transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.01] cursor-pointer touch-none ${
                          isComplete ? 'opacity-70' : ''
                        } ${checklist.isPinned ? 'ring-2 ring-amber-400/50 dark:ring-amber-500/30' : ''}`}
                      >
                          {/* Pinned Badge */}
                          {checklist.isPinned && (
                            <div className="absolute -top-2 left-4 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                              </svg>
                              سنجاق‌شده
                            </div>
                          )}

                          {/* Pin Button */}
                          <button
                            onClick={(e) => handleTogglePin(e, checklist.id, checklist.isPinned)}
                            disabled={isPinning}
                            className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              checklist.isPinned
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400'
                            } ${isPinning ? 'opacity-50' : ''}`}
                            title={checklist.isPinned ? 'برداشتن از سنجاق' : 'سنجاق کردن چک‌لیست'}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                            </svg>
                          </button>

                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                              style={{ backgroundColor: `${checklist.color}20` }}
                            >
                              {checklist.icon || '📋'}
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
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
                                  {total} مورد
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                پیشرفت
                              </span>
                              {isComplete ? (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  انجام شد 🎉
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {completed} از {total} انجام شده
                                </span>
                              )}
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isComplete
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            {/* Helper hint for 0% checklists */}
                            {isNotStarted && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                با انجام اولین آیتم شروع کن
                              </p>
                            )}
                          </div>

                          {/* CTA */}
                          <div className="flex items-center justify-end">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              {isComplete ? 'مشاهده' : 'ادامه چک‌لیست'}
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed Checklists Link */}
            {completedChecklists.length > 0 && (
              <div className="mb-6">
                <Link href="/checklists/completed">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xl">
                          🏆
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                            چک‌لیست‌های انجام‌شده
                          </h3>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            {completedChecklists.length} چک‌لیست تکمیل‌شده
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Archived Checklists Link */}
            {archivedChecklists.length > 0 && (
              <div className="mb-6">
                <Link href="/checklists/archive">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/50 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">
                          📦
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                            آرشیو چک‌لیست‌ها
                          </h3>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            {archivedChecklists.length} چک‌لیست آرشیو شده
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Saved Toast */}
      {showSavedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-emerald-600 text-white rounded-xl px-4 py-3 shadow-xl flex items-center gap-2">
            <span className="text-sm font-medium">پیشرفتت ذخیره شد 👌</span>
          </div>
        </div>
      )}

      {/* Pin Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div
            className={`rounded-xl px-4 py-3 shadow-xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Actions BottomSheet */}
      {selectedChecklist && (
        <BottomSheet isOpen={showMenu} onClose={() => setShowMenu(false)} title="کارهای قبل از خروج">
          <div className="space-y-3 pb-4">
            {/* Duplicate */}
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10 transition-all duration-300 group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {isDuplicating ? 'در حال کپی...' : 'کپی چک‌لیست'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ساخت نسخه جدید از این چک‌لیست</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Archive */}
            <button
              onClick={handleArchive}
              disabled={isArchiving}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/5 to-amber-500/5 hover:from-orange-500/10 hover:to-amber-500/10 transition-all duration-300 group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {isArchiving ? 'در حال آرشیو...' : 'آرشیو کردن'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">انتقال به بخش آرشیو</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Delete */}
            <div className="my-2" />
            <button
              onClick={() => {
                setShowMenu(false)
                setShowDeleteConfirm(true)
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-500/5 to-rose-500/5 hover:from-red-500/10 hover:to-rose-500/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-red-600 dark:text-red-400">حذف چک‌لیست</p>
                <p className="text-sm text-red-500 dark:text-red-500/70">حذف دائمی و غیرقابل بازگشت</p>
              </div>
              <svg className="w-5 h-5 text-red-300 group-hover:text-red-400 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
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
                این کار قابل بازگشت نیست
                <br />
                و همه آیتم‌ها حذف می‌شوند
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'در حال حذف...' : 'حذف برای همیشه'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Create Button (FAB) */}
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
