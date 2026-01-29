'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import {
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

export default function CategoriesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [projectId])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!name.trim()) {
      setError('نام دسته‌بندی الزامی است')
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim() || '📝',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      // Reset form and refresh
      setName('')
      setIcon('')
      setError('')
      setShowAddForm(false)
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد دسته‌بندی')
    }
  }

  const handleEdit = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    if (!name.trim()) {
      setError('نام دسته‌بندی الزامی است')
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim() || category.icon,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      // Reset form and refresh
      setName('')
      setIcon('')
      setError('')
      setEditingId(null)
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ویرایش دسته‌بندی')
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف دسته‌بندی')
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setName(category.name)
    setIcon(category.icon || '')
    setError('')
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setName('')
    setIcon('')
    setError('')
  }

  const startAdd = () => {
    setShowAddForm(true)
    setEditingId(null)
    setName('')
    setIcon('')
    setError('')
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getBackgroundClass()}`}>
        <div className={getTextColorClass('secondary')}>در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header */}
      <div className={`text-white p-6 shadow-lg ${getHeaderGradient('primary')}`}>
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ←
          </button>
          <h1 className="text-[22px] font-bold">
            مدیریت دسته‌بندی‌ها
          </h1>
        </div>
        <p className="text-white/90 mr-14 text-[14px]">
          دسته‌بندی‌های هزینه را مدیریت کنید
        </p>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {/* Add button */}
        {!showAddForm && !editingId && (
          <button
            onClick={startAdd}
            className="w-full bg-[#EF4444] dark:bg-[#F87171] text-white py-4 rounded-2xl font-bold text-[14px] shadow-sm transition-all"
          >
            ➕ افزودن دسته‌بندی جدید
          </button>
        )}

        {/* Add form */}
        {showAddForm && (
          <div className={`rounded-2xl p-6 space-y-4 shadow-sm ${getCardBackgroundClass()}`}>
            <h3 className={`font-bold text-[15px] ${getTextColorClass('primary')}`}>
              دسته‌بندی جدید
            </h3>

            <div>
              <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
                نام <span className={getTextColorClass('danger')}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: خوراک و خواربار"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
              />
            </div>

            <div>
              <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
                آیکون (ایموجی)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🍎"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
                maxLength={2}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-[#FEECEC] dark:bg-[#2D1212] border border-[#EF4444]/20 dark:border-[#F87171]/20 text-[#EF4444] dark:text-[#F87171] text-[14px]">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                className="flex-1 bg-[#EF4444] dark:bg-[#F87171] text-white py-3 rounded-xl font-bold text-[14px]"
              >
                ذخیره
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false)
                  setName('')
                  setIcon('')
                  setError('')
                }}
                className="flex-1 bg-[#E5E7EB] dark:bg-[#334155] py-3 rounded-xl font-bold text-[14px]"
              >
                انصراف
              </Button>
            </div>
          </div>
        )}

        {/* Categories list */}
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}
            >
              {editingId === category.id ? (
                // Edit mode
                <div className="space-y-4">
                  <div>
                    <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
                      نام <span className={getTextColorClass('danger')}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
                    />
                  </div>

                  <div>
                    <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
                      آیکون (ایموجی)
                    </label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
                      maxLength={2}
                    />
                  </div>

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-[#FEECEC] dark:bg-[#2D1212] border border-[#EF4444]/20 dark:border-[#F87171]/20 text-[#EF4444] dark:text-[#F87171] text-[14px]">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleEdit(category.id)}
                      className="flex-1 bg-[#EF4444] dark:bg-[#F87171] text-white py-3 rounded-xl font-bold text-[14px]"
                    >
                      ذخیره
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      className="flex-1 bg-[#E5E7EB] dark:bg-[#334155] py-3 rounded-xl font-bold text-[14px]"
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon || '📝'}</span>
                    <span className={`font-medium text-[14px] ${getTextColorClass('primary')}`}>
                      {category.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-colors bg-[#EEF2FF] dark:bg-[#1E1B3A] text-[#4F6EF7] dark:text-[#818CF8] text-[12px]"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-colors bg-[#FEECEC] dark:bg-[#2D1212] text-[#EF4444] dark:text-[#F87171] text-[12px]"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && !showAddForm && (
          <div className={`rounded-2xl p-12 text-center shadow-sm ${getCardBackgroundClass()}`}>
            <span className="text-6xl mb-4 block">📁</span>
            <p className={`mb-4 text-[14px] ${getTextColorClass('secondary')}`}>
              هنوز دسته‌بندی‌ای ایجاد نشده است
            </p>
            <button
              onClick={startAdd}
              className={`font-medium hover:underline text-[14px] ${getTextColorClass('danger')}`}
            >
              اولین دسته‌بندی را بسازید
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
