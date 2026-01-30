'use client'

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'

interface Category {
  id: string
  name: string
  icon?: string | null
  color?: string | null
}

interface CategoryEditorSheetProps {
  isOpen: boolean
  onClose: () => void
  category?: Category | null  // null = add mode, object = edit mode
  projectId: string
  onSuccess: () => void  // Callback to refresh list
}

export function CategoryEditorSheet({
  isOpen,
  onClose,
  category,
  projectId,
  onSuccess,
}: CategoryEditorSheetProps) {
  const isEditMode = !!category

  // Form state
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📝')
  const [color, setColor] = useState('#6B7280')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when sheet opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode: pre-fill with existing values
        setName(category.name)
        setIcon(category.icon || '📝')
        setColor(category.color || '#6B7280')
      } else {
        // Add mode: reset to defaults
        setName('')
        setIcon('📝')
        setColor('#6B7280')
      }
      setError('')
    }
  }, [isOpen, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('لطفاً یک نام وارد کنید')
      return
    }

    setLoading(true)

    try {
      const url = isEditMode
        ? `/api/projects/${projectId}/categories/${category.id}`
        : `/api/projects/${projectId}/categories`

      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon || '📝',
          color: color || '#6B7280',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ذخیره دسته‌بندی')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مشکلی پیش آمد، دوباره تلاش کنید')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
    >
      <form onSubmit={handleSubmit} style={{ padding: '8px 0 24px' }}>
        {/* Name Input */}
        <div className="mb-5">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" style={{ fontSize: '14px' }}>
            نام دسته‌بندی
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: خوراک"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-transparent text-gray-900 dark:text-gray-100"
            style={{ fontSize: '15px' }}
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Icon Picker */}
        <div className="mb-5">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" style={{ fontSize: '14px' }}>
            آیکون
          </label>
          <IconPicker value={icon} onChange={setIcon} disabled={loading} />
        </div>

        {/* Color Picker */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" style={{ fontSize: '14px' }}>
            رنگ
          </label>
          <ColorPicker value={color} onChange={setColor} disabled={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4" style={{ fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              backgroundColor: '#FF8A00',
              fontSize: '15px',
            }}
          >
            {loading ? (isEditMode ? 'در حال ویرایش...' : 'در حال ذخیره...') : 'ذخیره'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ fontSize: '15px' }}
          >
            لغو
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
