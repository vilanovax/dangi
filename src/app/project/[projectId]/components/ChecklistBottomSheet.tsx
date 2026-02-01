'use client'

import { useState, useMemo, KeyboardEvent } from 'react'
import { BottomSheet } from '@/components/ui'
import type { TravelChecklistItem } from '@/types/checklist'

interface ChecklistBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  items: TravelChecklistItem[]
  onUpdate: () => void
}

/**
 * Full Checklist View (Bottom Sheet)
 *
 * UX Principles:
 * - Active items always on top
 * - Done items move to bottom with strikethrough
 * - Auto-cleanup: completed items deleted after 24h
 * - Inline add at top for quick entry
 */
export function ChecklistBottomSheet({
  isOpen,
  onClose,
  projectId,
  items,
  onUpdate,
}: ChecklistBottomSheetProps) {
  const [newItemText, setNewItemText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Sort items: active first, then done (by completion time)
  const sortedItems = useMemo(() => {
    const active = items.filter((item) => item.status === 'active')
    const done = items
      .filter((item) => item.status === 'done')
      .sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
        return bTime - aTime // Most recent first
      })

    return [...active, ...done]
  }, [items])

  const activeCount = items.filter((item) => item.status === 'active').length

  // Add new item
  const handleAddItem = async () => {
    const text = newItemText.trim()
    if (!text) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/travel-checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در افزودن')
      }

      setNewItemText('')
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در افزودن')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Enter key in input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    }
  }

  // Toggle item status
  const handleToggleItem = async (itemId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'done' : 'active'

      const res = await fetch(`/api/projects/${projectId}/travel-checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('خطا در به‌روزرسانی')
      }

      onUpdate()
    } catch (err) {
      console.error('Error toggling item:', err)
    }
  }

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/travel-checklist/${itemId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('خطا در حذف')
      }

      onUpdate()
    } catch (err) {
      console.error('Error deleting item:', err)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="📝 کارهای سفر">
      <div className="space-y-4">
        {/* Add new item (inline input) */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="چی باید انجام بشه؟"
            disabled={submitting}
            autoFocus
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleAddItem}
            disabled={!newItemText.trim() || submitting}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Helper text about auto-cleanup */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          کارهای انجام‌شده فردا پاک می‌شن
        </p>

        {/* Checklist items */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {sortedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                چیزی برای انجام ندارید
              </p>
            </div>
          ) : (
            sortedItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                projectId={projectId}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />
            ))
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

/**
 * Individual checklist item row
 *
 * UX Principles:
 * - Checkbox on right (RTL)
 * - Done items: strikethrough + muted color
 * - Smooth transition on status change
 * - Swipe-to-delete for creator only
 */
function ChecklistItemRow({
  item,
  projectId,
  onToggle,
  onDelete,
}: {
  item: TravelChecklistItem
  projectId: string
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const isDone = item.status === 'done'

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-xl
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-800
        transition-all duration-150 ease-out
        ${isDone ? 'opacity-60' : 'opacity-100'}
      `}
      style={{
        /* Respect prefers-reduced-motion */
        transitionDuration: 'var(--checklist-motion-fast)',
        transitionTimingFunction: 'var(--checklist-motion-ease)',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, item.status)}
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
          transition-colors
          ${
            isDone
              ? 'bg-green-500 border-green-500'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-green-500'
          }
        `}
      >
        {isDone && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            isDone
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {item.text}
        </p>
        {item.createdByName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {item.createdByName}
          </p>
        )}
        {isDone && item.completedAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            انجام شد ✔️
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => {
          if (confirm('این مورد حذف بشه؟')) {
            onDelete(item.id)
          }
        }}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
