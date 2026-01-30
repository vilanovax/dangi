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
import { FamilyIcon } from '../components/FamilyIcon'
import { FamilyButton } from '../components/FamilyButton'

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
            <FamilyIcon name="back" size={24} className="text-white" />
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
        <FamilyButton
          onClick={() => handleOpenEditor()}
          variant="primary"
          size="lg"
          fullWidth
          icon="add"
        >
          افزودن دسته‌بندی جدید
        </FamilyButton>

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
                  {category.icon ? (
                    <span className="text-2xl">{category.icon}</span>
                  ) : (
                    <FamilyIcon name="note" size={24} className="text-gray-400 dark:text-gray-600" />
                  )}
                  <span className={`font-medium text-[14px] ${getTextColorClass('primary')}`}>
                    {category.name}
                  </span>
                </div>

                {/* Menu button */}
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <FamilyIcon name="more" size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => handleOpenEditor(category)}
                      className="w-full px-4 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-xl flex items-center gap-2"
                    >
                      <FamilyIcon name="edit" size={16} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleOpenDelete(category)}
                      className="w-full px-4 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-b-xl flex items-center gap-2"
                    >
                      <FamilyIcon name="delete" size={16} className="text-red-600 dark:text-red-400" />
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#FFF3E0] dark:bg-[#2D1F0D]">
              <FamilyIcon name="categories" size={36} className="text-[#FF8A00] dark:text-[#FFA94D]" />
            </div>
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
