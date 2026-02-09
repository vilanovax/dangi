/**
 * Checklists Section
 * Displays recent checklists on the home page
 * Compact mode for secondary visual importance
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BottomSheet, Button } from '@/components/ui'
import type { Checklist } from '@/types/checklist'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChecklistsResponse {
  checklists: Checklist[]
}

interface ChecklistsSectionProps {
  compact?: boolean
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getProgressPercentage(checklist: Checklist): number {
  const items = checklist.items || []
  if (items.length === 0) return 0
  const checked = items.filter((i) => i.isChecked).length
  return Math.round((checked / items.length) * 100)
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ChecklistsSection({ compact = false }: ChecklistsSectionProps) {
  const router = useRouter()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef(false)

  // ── Fetch Recent Checklists ─────────────────────────────────
  const fetchChecklists = useCallback(async () => {
    try {
      const res = await fetch('/api/checklists?includeArchived=false')
      if (!res.ok) {
        setChecklists([])
        setTotalCount(0)
        return
      }
      const data: ChecklistsResponse = await res.json()
      setTotalCount(data.checklists.length)
      // Get 3 most recent
      setChecklists(data.checklists.slice(0, 3))
    } catch (error) {
      console.error('Error fetching checklists:', error)
      setChecklists([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChecklists()
  }, [fetchChecklists])

  // ── Long Press Handlers ──────────────────────────────────────
  const handlePointerDown = useCallback((checklist: Checklist, e: React.PointerEvent) => {
    // Prevent default to stop ghost clicks
    e.preventDefault()

    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setSelectedChecklist(checklist)
      setShowMenu(true)
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }, [])

  const handlePointerUp = useCallback((checklistId: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // If long press was triggered, don't navigate
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }

    // Otherwise navigate after a tiny delay
    setTimeout(() => {
      router.push(`/checklists/${checklistId}`)
    }, 10)
  }, [router])

  const handlePointerMove = useCallback(() => {
    // Cancel long press if user moves pointer/finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // ── Duplicate Checklist ──────────────────────────────────────
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

      await fetchChecklists()
      setSelectedChecklist(null)
    } catch (error) {
      console.error('Error duplicating checklist:', error)
    } finally {
      setIsDuplicating(false)
    }
  }, [selectedChecklist, fetchChecklists])

  // ── Archive Checklist ────────────────────────────────────────
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

      await fetchChecklists()
      setSelectedChecklist(null)
    } catch (error) {
      console.error('Error archiving checklist:', error)
    } finally {
      setIsArchiving(false)
    }
  }, [selectedChecklist, fetchChecklists])

  // ── Delete Checklist ─────────────────────────────────────────
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
      await fetchChecklists()
      setSelectedChecklist(null)
    } catch (error) {
      console.error('Error deleting checklist:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedChecklist, fetchChecklists])

  // ── Don't show if loading ─────────────────────────────────
  if (isLoading) {
    return null
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
          <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">
            چک‌لیست‌ها
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {checklists.length > 0 && (
            <Link
              href="/checklists"
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              مشاهده همه ({totalCount})
            </Link>
          )}
          <Link href="/checklists/new">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors shadow-sm hover:shadow-md">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              جدید
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {checklists.length === 0 ? (
        // Empty State - Compact
        <Link href="/checklists/new">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 flex items-center justify-center transition-colors">
              <svg className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              چک‌لیستی نداری؟ یکی بساز
            </p>
          </div>
        </Link>
      ) : compact ? (
        // Compact Mode - 2 Column Grid
        <div className="grid grid-cols-2 gap-3">
          {checklists.slice(0, 4).map((checklist) => {
            const progress = getProgressPercentage(checklist)
            const items = checklist.items || []
            return (
              <div
                key={checklist.id}
                onPointerDown={(e) => handlePointerDown(checklist, e)}
                onPointerUp={(e) => handlePointerUp(checklist.id, e)}
                onPointerMove={handlePointerMove}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setSelectedChecklist(checklist)
                  setShowMenu(true)
                }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer touch-none"
              >
                {/* Icon + Title */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                    <span className="text-lg">{checklist.icon || '📋'}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
                    {checklist.title}
                  </h3>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {items.filter((i) => i.isChecked).length}/{items.length} مورد
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Regular Mode - 2 Column Grid
        <div className="grid grid-cols-2 gap-3">
          {checklists.map((checklist) => {
            const progress = getProgressPercentage(checklist)
            const items = checklist.items || []
            return (
              <div
                key={checklist.id}
                onPointerDown={(e) => handlePointerDown(checklist, e)}
                onPointerUp={(e) => handlePointerUp(checklist.id, e)}
                onPointerMove={handlePointerMove}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setSelectedChecklist(checklist)
                  setShowMenu(true)
                }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer touch-none"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                    <span className="text-xl">{checklist.icon || '📋'}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
                    {checklist.title}
                  </h3>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {items.filter((i) => i.isChecked).length}/{items.length} مورد
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
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
    </section>
  )
}
