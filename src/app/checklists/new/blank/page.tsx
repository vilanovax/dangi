/**
 * Blank Checklist Creation Page
 * Create a custom checklist from scratch
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type { ChecklistCategoryId } from '@/lib/domain/checklist-templates/types'

// ─────────────────────────────────────────────────────────────
// Category Options
// ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'travel' as ChecklistCategoryId, title: 'سفر', icon: '✈️', color: '#3b82f6' },
  { id: 'gathering' as ChecklistCategoryId, title: 'دورهمی', icon: '🎉', color: '#a855f7' },
  {
    id: 'personal-finance' as ChecklistCategoryId,
    title: 'خرج شخصی',
    icon: '💰',
    color: '#f59e0b',
  },
]

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function BlankChecklistPage() {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ChecklistCategoryId>('travel')
  const [isCreating, setIsCreating] = useState(false)

  // ── Get Selected Category Info ──────────────────────────────
  const selectedCategoryInfo = CATEGORIES.find((c) => c.id === category)!

  // ── Create Checklist ────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('لطفاً عنوان چک‌لیست را وارد کنید')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          icon: selectedCategoryInfo.icon,
          color: selectedCategoryInfo.color,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create checklist')
      }

      const data = await res.json()
      router.push(`/checklists/${data.checklist.id}`)
    } catch (error) {
      console.error('Error creating checklist:', error)
      alert(error instanceof Error ? error.message : 'خطا در ایجاد چک‌لیست')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Main Render ─────────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
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

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ایجاد چک‌لیست جدید
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            مشخصات چک‌لیست خود را وارد کنید
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان چک‌لیست <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: خرید هفتگی، لوازم سفر..."
              className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              توضیحات (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات اضافی..."
              rows={3}
              className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 resize-none"
              maxLength={500}
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              دسته‌بندی <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    category === cat.id
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="text-xs font-medium">{cat.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">پیش‌نمایش:</p>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${selectedCategoryInfo.color}20` }}
              >
                {selectedCategoryInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {title.trim() || 'عنوان چک‌لیست'}
                </h3>
                {description.trim() && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {description.trim()}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                    {selectedCategoryInfo.title}
                  </span>
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                    0 مورد
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isCreating || !title.trim()}
            className="w-full !bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 disabled:opacity-50"
            size="lg"
          >
            {isCreating ? 'در حال ایجاد...' : 'ایجاد چک‌لیست'}
          </Button>
        </form>
      </div>
    </main>
  )
}
