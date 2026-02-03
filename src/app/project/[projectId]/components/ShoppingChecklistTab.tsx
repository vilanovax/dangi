'use client'

import { useState, useEffect, useRef } from 'react'
import type { ShoppingItem, ShoppingStats } from '@/types'
import { ShoppingItemCard } from './ShoppingItemCard'
import { ShoppingItemInput } from './ShoppingItemInput'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface ShoppingChecklistTabProps {
  projectId: string
  currentParticipantId?: string
  participants: Participant[]
}

export function ShoppingChecklistTab({
  projectId,
  currentParticipantId,
  participants,
}: ShoppingChecklistTabProps) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [stats, setStats] = useState<ShoppingStats>({ total: 0, checked: 0, unchecked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Track post-check item for expense prompt
  const [recentlyCheckedItem, setRecentlyCheckedItem] = useState<ShoppingItem | null>(null)

  // Ref for auto-focusing input
  const inputRef = useRef<{ focus: () => void }>(null)

  useEffect(() => {
    fetchItems()
  }, [projectId])

  // Auto-collapse when all items completed, expand when pending
  useEffect(() => {
    if (stats.total > 0 && stats.unchecked === 0) {
      setIsCollapsed(true)
    } else if (stats.unchecked > 0) {
      setIsCollapsed(false)
    }
  }, [stats])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/shopping-items`)
      if (!res.ok) throw new Error('خطا در بارگذاری لیست')

      const data = await res.json()
      setItems(data.items)
      setStats(data.stats)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری لیست')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (text: string, quantity?: string, note?: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          quantity: quantity || undefined,
          note: note || undefined,
          addedById: currentParticipantId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در افزودن آیتم')
      }

      // Refetch to get updated sorted list
      await fetchItems()

      // Keep focus for fast multiple adds
      inputRef.current?.focus()
    } catch (err) {
      throw err // Re-throw to let input component handle it
    }
  }

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isChecked,
          checkedById: isChecked ? currentParticipantId : undefined,
        }),
      })

      if (!res.ok) throw new Error('خطا در به‌روزرسانی')

      const data = await res.json()

      // If checking an item, show expense prompt
      if (isChecked) {
        setRecentlyCheckedItem(data.item)
        // Auto-dismiss after 5 seconds
        setTimeout(() => setRecentlyCheckedItem(null), 5000)
      }

      // Refetch to get updated sorted list
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در به‌روزرسانی')
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف آیتم')

      // Refetch to get updated list
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف آیتم')
    }
  }

  const handleEdit = async (
    itemId: string,
    text: string,
    quantity?: string,
    note?: string,
    assignedToId?: string
  ) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          quantity: quantity || undefined,
          note: note || undefined,
          assignedToId: assignedToId || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ویرایش آیتم')
      }

      // Refetch to get updated list
      await fetchItems()
    } catch (err) {
      throw err
    }
  }

  const handleAssign = async (itemId: string, assignedToId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId }),
      })

      if (!res.ok) throw new Error('خطا در تغییر مسئول')

      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تغییر مسئول')
    }
  }

  // Split items into unchecked and checked
  const uncheckedItems = items.filter((item) => !item.isChecked)
  const checkedItems = items.filter((item) => item.isChecked)

  // All completed state
  const allCompleted = stats.total > 0 && stats.unchecked === 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* ─── Header Card ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30 text-right transition-all hover:shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Expand/Collapse indicator */}
            <svg
              className={`w-5 h-5 text-purple-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <div>
              {allCompleted ? (
                <>
                  <h3 className="text-sm font-bold text-green-600 dark:text-green-400">
                    چک‌لیست خرید کامل شد ✓
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    همه خریدها انجام شده!
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    چک‌لیست خرید
                    {stats.total > 0 && (
                      <span className="text-purple-500 dark:text-purple-400 mr-1.5">
                        ({stats.total} مورد)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {stats.unchecked > 0 ? `${stats.unchecked} خرید مونده` : 'لیست خالیه'}
                  </p>
                </>
              )}
            </div>
          </div>
          {/* Progress indicator */}
          <div className="text-left">
            <div className={`text-2xl font-bold ${allCompleted ? 'text-green-500 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
              {stats.checked}/{stats.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              انجام شده
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${allCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
              style={{ width: `${(stats.checked / stats.total) * 100}%` }}
            />
          </div>
        )}
      </button>

      {/* ─── Collapsible Content ─────────────────────────────────── */}
      {!isCollapsed && (
        <div className="space-y-4 animate-slideDown">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Add New Item */}
          <ShoppingItemInput ref={inputRef} onAdd={handleAdd} />

          {/* Post-check expense prompt */}
          {recentlyCheckedItem && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 flex items-center justify-between animate-slideDown">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                این خرید خرج داشت؟
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`/project/${projectId}/add-expense?title=${encodeURIComponent(recentlyCheckedItem.text)}`}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  ثبت خرج
                </a>
                <button
                  onClick={() => setRecentlyCheckedItem(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2">
            {/* Unchecked Items */}
            {uncheckedItems.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                participants={participants}
                currentParticipantId={currentParticipantId}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onAssign={handleAssign}
              />
            ))}

            {/* Checked Items - Separator */}
            {checkedItems.length > 0 && uncheckedItems.length > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-600">خریده شده</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            )}

            {/* Checked Items */}
            {checkedItems.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                participants={participants}
                currentParticipantId={currentParticipantId}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onAssign={handleAssign}
              />
            ))}

            {/* Empty State */}
            {items.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🛒</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  لیست خالیه! چی باید بخریم؟
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
