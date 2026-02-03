/**
 * Checklist Detail Page
 * View and manage checklist items
 */

'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type { Checklist, ChecklistItem } from '@/types/checklist'
import { ChecklistSettingsSheet } from './ChecklistSettingsSheet'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChecklistResponse {
  checklist: Checklist
}

interface CreateItemResponse {
  item: ChecklistItem
}

interface DeletedItem {
  item: ChecklistItem
  index: number
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ChecklistDetailPage({ params }: { params: Promise<{ checklistId: string }> }) {
  const { checklistId } = use(params)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // ── State ───────────────────────────────────────────────────
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Undo/Snackbar state
  const [deletedItem, setDeletedItem] = useState<DeletedItem | null>(null)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Animation states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null)

  // Modal states
  const [showEditTitleModal, setShowEditTitleModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const editTitleInputRef = useRef<HTMLInputElement>(null)

  // ── Fetch Checklist ─────────────────────────────────────────
  useEffect(() => {
    async function fetchChecklist() {
      try {
        const res = await fetch(`/api/checklists/${checklistId}`)
        if (!res.ok) {
          if (res.status === 404) {
            router.push('/checklists')
            return
          }
          throw new Error('Failed to fetch checklist')
        }
        const data: ChecklistResponse = await res.json()
        setChecklist(data.checklist)
      } catch (error) {
        console.error('Error fetching checklist:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChecklist()
  }, [checklistId, router])

  // ── Cleanup undo timeout on unmount ─────────────────────────
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
    }
  }, [])

  // ── Toast helper ─────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }, [])

  // ── Edit Title Focus ─────────────────────────────────────────
  useEffect(() => {
    if (showEditTitleModal && editTitleInputRef.current) {
      editTitleInputRef.current.focus()
      editTitleInputRef.current.select()
    }
  }, [showEditTitleModal])

  // ── Add Item ────────────────────────────────────────────────
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemText.trim() || !checklist) return

    setIsAdding(true)
    try {
      const res = await fetch(`/api/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newItemText.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to add item')

      const data: CreateItemResponse = await res.json()
      setChecklist({
        ...checklist,
        items: [...(checklist.items || []), data.item],
      })
      setNewItemText('')
      // Keep input focused for continuous adding
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error adding item:', error)
      alert('خطا در افزودن آیتم')
    } finally {
      setIsAdding(false)
    }
  }

  // ── Toggle Item ─────────────────────────────────────────────
  const handleToggleItem = async (itemId: string, currentChecked: boolean) => {
    if (!checklist || checklist.isArchived) return

    const items = checklist.items || []
    const wasFirstCompletion = !currentChecked && items.filter(i => i.isChecked).length === 0

    // Optimistic update
    setChecklist({
      ...checklist,
      items: items.map((item) =>
        item.id === itemId ? { ...item, isChecked: !currentChecked } : item
      ),
    })

    // Show success animation for first completion
    if (wasFirstCompletion) {
      setRecentlyCompletedId(itemId)
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
        setRecentlyCompletedId(null)
      }, 2000)
    }

    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }

    try {
      const res = await fetch(`/api/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked: !currentChecked }),
      })

      if (!res.ok) throw new Error('Failed to toggle item')
    } catch (error) {
      console.error('Error toggling item:', error)
      // Revert on error
      setChecklist({
        ...checklist,
        items: items.map((item) =>
          item.id === itemId ? { ...item, isChecked: currentChecked } : item
        ),
      })
    }
  }

  // ── Delete Item with Undo ───────────────────────────────────
  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!checklist) return

    // Clear any existing undo timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
    }

    const items = checklist.items || []
    const itemIndex = items.findIndex((item) => item.id === itemId)
    const itemToDelete = items[itemIndex]

    if (!itemToDelete) return

    // Optimistic delete
    setChecklist({
      ...checklist,
      items: items.filter((item) => item.id !== itemId),
    })

    // Store for undo
    setDeletedItem({ item: itemToDelete, index: itemIndex })

    // Auto-dismiss snackbar after 3 seconds and delete permanently
    undoTimeoutRef.current = setTimeout(async () => {
      setDeletedItem(null)
      try {
        await fetch(`/api/checklists/${checklistId}/items/${itemId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }, 3000)
  }, [checklist, checklistId])

  // ── Undo Delete ─────────────────────────────────────────────
  const handleUndoDelete = useCallback(() => {
    if (!deletedItem || !checklist) return

    // Clear timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }

    // Restore item
    const items = [...(checklist.items || [])]
    items.splice(deletedItem.index, 0, deletedItem.item)
    setChecklist({ ...checklist, items })
    setDeletedItem(null)
  }, [deletedItem, checklist])

  // ── Edit Title Handler ──────────────────────────────────────
  const handleOpenEditTitle = () => {
    if (checklist) {
      setEditTitle(checklist.title)
      setShowEditTitleModal(true)
      setShowActions(false)
    }
  }

  const handleSaveTitle = async () => {
    if (!checklist || !editTitle.trim()) return

    setIsSavingTitle(true)
    try {
      const res = await fetch(`/api/checklists/${checklistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      })

      if (!res.ok) throw new Error('Failed to update title')

      const data = await res.json()
      setChecklist(data.checklist)
      setShowEditTitleModal(false)
      showToast('عنوان چک‌لیست ذخیره شد ✅')
    } catch (error) {
      console.error('Error updating title:', error)
      showToast('خطا در ذخیره عنوان', 'error')
    } finally {
      setIsSavingTitle(false)
    }
  }

  // ── Reset to Template Handler ──────────────────────────────
  const handleResetToTemplate = async () => {
    if (!checklist) return

    setIsResetting(true)
    try {
      // Call the settings sheet's reset logic via the API
      // First, uncheck all items
      const uncheckPromises = (checklist.items || []).map((item) =>
        fetch(`/api/checklists/${checklistId}/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isChecked: false }),
        })
      )
      await Promise.all(uncheckPromises)

      // Refresh the checklist
      const res = await fetch(`/api/checklists/${checklistId}`)
      if (res.ok) {
        const data = await res.json()
        setChecklist(data.checklist)
      }

      setShowResetConfirm(false)
      showToast('چک‌لیست بازگردانی شد ✅')
    } catch (error) {
      console.error('Error resetting checklist:', error)
      showToast('خطا در بازگردانی', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  // ── Archive Checklist ───────────────────────────────────────
  const handleArchive = async () => {
    if (!checklist) return

    setIsArchiving(true)
    try {
      const res = await fetch(`/api/checklists/${checklistId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: !checklist.isArchived }),
      })

      if (!res.ok) throw new Error('Failed to archive checklist')

      showToast(checklist.isArchived ? 'از آرشیو خارج شد' : 'به آرشیو منتقل شد 📦')
      setTimeout(() => router.push('/checklists'), 500)
    } catch (error) {
      console.error('Error archiving checklist:', error)
      showToast('خطا در آرشیو کردن', 'error')
    } finally {
      setIsArchiving(false)
      setShowActions(false)
    }
  }

  // ── Delete Checklist ────────────────────────────────────────
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/checklists/${checklistId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete checklist')

      showToast('چک‌لیست حذف شد')
      setTimeout(() => router.push('/checklists'), 500)
    } catch (error) {
      console.error('Error deleting checklist:', error)
      showToast('خطا در حذف چک‌لیست', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // ── Duplicate Checklist ─────────────────────────────────────
  const handleDuplicate = async () => {
    if (!checklist) return

    setIsDuplicating(true)
    setShowActions(false)
    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${checklist.title} (کپی)`,
          description: checklist.description,
          icon: checklist.icon,
          color: checklist.color,
          category: checklist.category,
          items: (checklist.items || []).map(item => ({
            text: item.text,
            note: item.note,
          })),
        }),
      })

      if (!res.ok) throw new Error('Failed to duplicate checklist')

      const data = await res.json()
      showToast('چک‌لیست کپی شد ✅')
      setTimeout(() => router.push(`/checklists/${data.checklist.id}`), 500)
    } catch (error) {
      console.error('Error duplicating checklist:', error)
      showToast('خطا در کپی چک‌لیست', 'error')
    } finally {
      setIsDuplicating(false)
    }
  }

  // ── Calculate Progress ──────────────────────────────────────
  const items = checklist?.items || []
  const completedCount = items.filter((i) => i.isChecked).length
  const progress = items.length === 0
    ? 0
    : Math.round((completedCount / items.length) * 100)
  const isComplete = items.length > 0 && progress === 100

  // ── Loading State ───────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5">
        <div className="max-w-2xl mx-auto">
          <div className="h-32 bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl mb-6 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!checklist) {
    return null
  }

  // ── Main Render ─────────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5 pb-32">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              بازگشت
            </button>

            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl flex items-center justify-center hover:shadow-md transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {/* Actions Dropdown */}
              {showActions && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowActions(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/50 dark:border-gray-700/50 min-w-[220px]">
                    {/* Edit Section - Hidden for archived checklists */}
                    {!checklist.isArchived && (
                      <>
                        <div className="px-3 py-1.5">
                          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">📝 ویرایشی</span>
                        </div>
                        <button
                          onClick={handleOpenEditTitle}
                          className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                        >
                          <span>✏️</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            ویرایش عنوان چک‌لیست
                          </span>
                        </button>
                        <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                      </>
                    )}

                    {/* Management Section */}
                    <div className="px-3 py-1.5">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">🔁 مدیریتی</span>
                    </div>
                    {/* Reset - Hidden for archived */}
                    {!checklist.isArchived && (
                      <button
                        onClick={() => {
                          setShowResetConfirm(true)
                          setShowActions(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                      >
                        <span>↩️</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          بازگردانی به تمپلیت
                        </span>
                      </button>
                    )}
                    {/* Duplicate - Hidden for archived */}
                    {!checklist.isArchived && (
                      <button
                        onClick={handleDuplicate}
                        disabled={isDuplicating}
                        className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <span>📋</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {isDuplicating ? 'در حال کپی...' : 'کپی چک‌لیست'}
                        </span>
                      </button>
                    )}
                    {/* Archive/Unarchive - Always visible */}
                    <button
                      onClick={handleArchive}
                      disabled={isArchiving}
                      className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <span>{checklist.isArchived ? '📤' : '📦'}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isArchiving ? 'در حال انتقال...' : checklist.isArchived ? 'بازگردانی از آرشیو' : 'آرشیو کردن'}
                      </span>
                    </button>

                    {/* Destructive Section */}
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                    <div className="px-3 py-1.5">
                      <span className="text-xs font-medium text-red-400 dark:text-red-500">⚠️ مخرب</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true)
                        setShowActions(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <span>🗑️</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        حذف چک‌لیست
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Archived Banner */}
          {checklist.isArchived && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">📦</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    این چک‌لیست آرشیو شده است
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    برای ویرایش، ابتدا آن را بازگردان
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Header Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor: `${checklist.color}20` }}
              >
                {checklist.icon || '📋'}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {checklist.title}
                </h1>
                {/* Ownership Label */}
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                  چک‌لیست شخصی شما
                </p>
                {checklist.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {checklist.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                    {items.length} مورد
                  </span>
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg">
                    {completedCount} از {items.length} انجام شده
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  پیشرفت
                </span>
                {isComplete ? (
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    همه کارها انجام شد 🎉
                  </span>
                ) : (
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {progress}%
                  </span>
                )}
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-center animate-fade-in">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              عالی! ادامه بده 👌
            </span>
          </div>
        )}

        {/* Add New Item Form - Hidden for archived checklists */}
        {!checklist.isArchived && (
          <form onSubmit={handleAddItem} className="mb-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50 dark:border-gray-700/50">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="مثلاً: خاموش کردن کولر"
                  className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  maxLength={200}
                  disabled={isAdding}
                />
                <Button
                  type="submit"
                  disabled={isAdding || !newItemText.trim()}
                  className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 disabled:opacity-50 !px-6"
                >
                  {isAdding ? '...' : 'افزودن'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                چک‌لیست خالی است
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                می‌تونی آیتم‌های دلخواهت رو اضافه کنی
              </p>
              <Button
                onClick={() => inputRef.current?.focus()}
                className="!bg-gradient-to-r !from-blue-500 !to-purple-600"
              >
                افزودن اولین آیتم
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-md border border-white/50 dark:border-gray-700/50 transition-all duration-300 ${
                  item.isChecked ? 'opacity-60' : 'hover:shadow-lg'
                } ${recentlyCompletedId === item.id ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleItem(item.id, item.isChecked)}
                    className={`shrink-0 mt-0.5 ${checklist.isArchived ? 'cursor-not-allowed' : ''}`}
                    title={checklist.isArchived ? 'چک‌لیست آرشیو شده است' : item.isChecked ? 'برای لغو، دوباره تیک را بردار' : 'علامت‌گذاری به عنوان انجام شده'}
                    disabled={checklist.isArchived}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        item.isChecked
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {item.isChecked && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Item Text */}
                  <div className="flex-1">
                    <p
                      className={`text-sm transition-all ${
                        item.isChecked
                          ? 'text-gray-400 dark:text-gray-500 line-through'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.text}
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.note}
                      </p>
                    )}
                  </div>

                  {/* Delete Button - Hidden for archived checklists */}
                  {!checklist.isArchived && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors group"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completion Celebration */}
        {isComplete && items.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-center shadow-xl">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">تمام موارد انجام شد!</h3>
            <p className="text-emerald-100 text-sm">
              تبریک! همه آیتم‌های این چک‌لیست را کامل کردید
            </p>
          </div>
        )}
      </div>

      {/* Undo Snackbar */}
      {deletedItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl px-4 py-3 shadow-xl flex items-center gap-4">
            <span className="text-sm">آیتم حذف شد</span>
            <button
              onClick={handleUndoDelete}
              className="text-sm font-medium text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-700 transition-colors"
            >
              بازگردانی
            </button>
          </div>
        </div>
      )}

      {/* Settings Sheet */}
      {checklist && (
        <ChecklistSettingsSheet
          checklist={checklist}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onUpdate={(updatedChecklist) => {
            setChecklist(updatedChecklist)
            setShowSettings(false)
          }}
        />
      )}

      {/* Edit Title Modal */}
      {showEditTitleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditTitleModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              ویرایش عنوان چک‌لیست
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveTitle()
              }}
            >
              <input
                ref={editTitleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="مثلاً: آماده‌سازی ماشین برای سفر"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                maxLength={100}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditTitleModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSavingTitle || !editTitle.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50"
                >
                  {isSavingTitle ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-3xl">
                ↩️
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                بازگردانی به تمپلیت؟
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                آیتم‌های شخصی شما حذف می‌شوند
                <br />
                و لیست به حالت اولیه بازمی‌گردد
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleResetToTemplate}
                disabled={isResetting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50"
              >
                {isResetting ? 'در حال بازگردانی...' : 'بازگردانی'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
