'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CategoryEditorSheet } from '@/components/categories/CategoryEditorSheet'
import { DeleteCategoryDialog } from '@/components/categories/DeleteCategoryDialog'
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

  // Bottom Sheet states
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

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

  const handleOpenEditor = (category?: Category) => {
    setSelectedCategory(category || null)
    setEditorOpen(true)
  }

  const handleOpenDelete = (category: Category) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchCategories()
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
        <button
          onClick={() => handleOpenEditor()}
          className="w-full bg-[#FF8A00] hover:bg-[#E67A00] text-white py-4 rounded-2xl font-bold text-[14px] shadow-sm transition-all active:scale-[0.98]"
        >
          + افزودن دسته‌بندی جدید
        </button>

        {/* Categories list */}
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Color indicator */}
                  {category.color && (
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <span className="text-2xl">{category.icon || '📝'}</span>
                  <span className={`font-medium text-[14px] ${getTextColorClass('primary')}`}>
                    {category.name}
                  </span>
                </div>

                {/* Menu button */}
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => handleOpenEditor(category)}
                      className="w-full px-4 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-xl flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleOpenDelete(category)}
                      className="w-full px-4 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-b-xl flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-red-600 dark:text-red-400 text-sm">حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className={`rounded-2xl p-12 text-center shadow-sm ${getCardBackgroundClass()}`}>
            <span className="text-6xl mb-4 block">📁</span>
            <p className={`mb-4 text-[14px] ${getTextColorClass('secondary')}`}>
              هنوز دسته‌بندی‌ای ایجاد نشده است
            </p>
            <button
              onClick={() => handleOpenEditor()}
              className={`font-medium hover:underline text-[14px] ${getTextColorClass('danger')}`}
            >
              اولین دسته‌بندی را بسازید
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheets */}
      <CategoryEditorSheet
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        category={selectedCategory}
        projectId={projectId}
        onSuccess={handleSuccess}
      />

      <DeleteCategoryDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        category={selectedCategory}
        projectId={projectId}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
