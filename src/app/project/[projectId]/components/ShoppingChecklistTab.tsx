'use client'

import { useState, useEffect } from 'react'
import type { ShoppingItem, ShoppingStats } from '@/types'
import { ShoppingItemCard } from './ShoppingItemCard'
import { ShoppingItemInput } from './ShoppingItemInput'

interface ShoppingChecklistTabProps {
  projectId: string
  currentParticipantId?: string
}

export function ShoppingChecklistTab({ projectId, currentParticipantId }: ShoppingChecklistTabProps) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [stats, setStats] = useState<ShoppingStats>({ total: 0, checked: 0, unchecked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItems()
  }, [projectId])

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
    } catch (err) {
      throw err // Re-throw to let input component handle it
    }
  }

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked }),
      })

      if (!res.ok) throw new Error('خطا در به‌روزرسانی')

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

  const handleEdit = async (itemId: string, text: string, quantity?: string, note?: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          quantity: quantity || undefined,
          note: note || undefined,
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

  // Split items into unchecked and checked
  const uncheckedItems = items.filter((item) => !item.isChecked)
  const checkedItems = items.filter((item) => item.isChecked)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Stats Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              لیست خرید 🛒
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              {stats.unchecked > 0 ? `${stats.unchecked} چیز مونده` : 'همه چیز خریده شد! 🎉'}
            </p>
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.checked}/{stats.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              خریده شده
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Add New Item */}
      <ShoppingItemInput onAdd={handleAdd} />

      {/* Items List */}
      <div className="space-y-2">
        {/* Unchecked Items */}
        {uncheckedItems.map((item) => (
          <ShoppingItemCard
            key={item.id}
            item={item}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
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
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
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
  )
}
