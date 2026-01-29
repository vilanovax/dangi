/**
 * Checklist Detail Page
 * View and manage checklist items
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type { Checklist, ChecklistItem } from '@/types/checklist'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChecklistResponse {
  checklist: Checklist
}

interface CreateItemResponse {
  item: ChecklistItem
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ChecklistDetailPage({ params }: { params: { checklistId: string } }) {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)

  // ── Fetch Checklist ─────────────────────────────────────────
  useEffect(() => {
    async function fetchChecklist() {
      try {
        const res = await fetch(`/api/checklists/${params.checklistId}`)
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
  }, [params.checklistId, router])

  // ── Add Item ────────────────────────────────────────────────
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemText.trim() || !checklist) return

    setIsAdding(true)
    try {
      const res = await fetch(`/api/checklists/${params.checklistId}/items`, {
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
        items: [...checklist.items, data.item],
      })
      setNewItemText('')
    } catch (error) {
      console.error('Error adding item:', error)
      alert('خطا در افزودن آیتم')
    } finally {
      setIsAdding(false)
    }
  }

  // ── Toggle Item ─────────────────────────────────────────────
  const handleToggleItem = async (itemId: string, currentChecked: boolean) => {
    if (!checklist) return

    // Optimistic update
    setChecklist({
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === itemId ? { ...item, isChecked: !currentChecked } : item
      ),
    })

    try {
      const res = await fetch(`/api/checklists/${params.checklistId}/items/${itemId}`, {
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
        items: checklist.items.map((item) =>
          item.id === itemId ? { ...item, isChecked: currentChecked } : item
        ),
      })
    }
  }

  // ── Delete Item ─────────────────────────────────────────────
  const handleDeleteItem = async (itemId: string) => {
    if (!checklist) return
    if (!confirm('آیا از حذف این آیتم مطمئن هستید؟')) return

    // Optimistic update
    const originalItems = checklist.items
    setChecklist({
      ...checklist,
      items: checklist.items.filter((item) => item.id !== itemId),
    })

    try {
      const res = await fetch(`/api/checklists/${params.checklistId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete item')
    } catch (error) {
      console.error('Error deleting item:', error)
      // Revert on error
      setChecklist({ ...checklist, items: originalItems })
      alert('خطا در حذف آیتم')
    }
  }

  // ── Archive Checklist ───────────────────────────────────────
  const handleArchive = async () => {
    if (!checklist) return

    try {
      const res = await fetch(`/api/checklists/${params.checklistId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: !checklist.isArchived }),
      })

      if (!res.ok) throw new Error('Failed to archive checklist')

      router.push('/checklists')
    } catch (error) {
      console.error('Error archiving checklist:', error)
      alert('خطا در آرشیو کردن چک‌لیست')
    }
  }

  // ── Delete Checklist ────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('آیا از حذف این چک‌لیست مطمئن هستید؟ این عمل قابل بازگشت نیست.'))
      return

    try {
      const res = await fetch(`/api/checklists/${params.checklistId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete checklist')

      router.push('/checklists')
    } catch (error) {
      console.error('Error deleting checklist:', error)
      alert('خطا در حذف چک‌لیست')
    }
  }

  // ── Calculate Progress ──────────────────────────────────────
  const progress = checklist
    ? checklist.items.length === 0
      ? 0
      : Math.round(
          (checklist.items.filter((i) => i.isChecked).length / checklist.items.length) * 100
        )
    : 0

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
          </div>

          {/* Actions Menu */}
          {showActions && (
            <div className="mb-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/50 dark:border-gray-700/50">
              <button
                onClick={handleArchive}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <span>{checklist.isArchived ? '📤' : '📦'}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {checklist.isArchived ? 'خروج از آرشیو' : 'آرشیو کردن'}
                </span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <span>🗑️</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  حذف چک‌لیست
                </span>
              </button>
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {checklist.title}
                </h1>
                {checklist.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {checklist.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                    {checklist.items.length} مورد
                  </span>
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg">
                    {checklist.items.filter((i) => i.isChecked).length} انجام شده
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
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {progress}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add New Item Form */}
        <form onSubmit={handleAddItem} className="mb-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50 dark:border-gray-700/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="افزودن آیتم جدید..."
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

        {/* Items List */}
        <div className="space-y-3">
          {checklist.items.length === 0 ? (
            <div className="text-center py-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                آیتمی وجود ندارد. یک آیتم جدید اضافه کنید
              </p>
            </div>
          ) : (
            checklist.items.map((item) => (
              <div
                key={item.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-md border border-white/50 dark:border-gray-700/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleItem(item.id, item.isChecked)}
                    className="shrink-0 mt-0.5"
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
                      className={`text-sm ${
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

                  {/* Delete Button */}
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
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completion Message */}
        {checklist.items.length > 0 && progress === 100 && (
          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-center shadow-xl">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">تمام موارد انجام شد!</h3>
            <p className="text-emerald-100 text-sm">
              تبریک! همه آیتم‌های این چک‌لیست را کامل کردید
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
