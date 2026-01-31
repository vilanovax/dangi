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
import { designTokens as dt } from '@/styles/design-tokens'
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
      <div className={`text-white shadow-lg ${getHeaderGradient('primary')}`} style={{ padding: dt.spacing[6] }}>
        <div className="flex items-center" style={{ gap: dt.spacing[4], marginBottom: dt.spacing[2] }}>
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full transition-colors"
            style={{ padding: dt.spacing[2] }}
          >
            <FamilyIcon name="back" size={24} className="text-white" />
          </button>
          <h1 className="font-bold" style={{ fontSize: dt.typography.sizes.headline }}>
            مدیریت دسته‌بندی‌ها
          </h1>
        </div>
        <p className="text-white/90" style={{ marginRight: 56, fontSize: dt.typography.sizes.body }}>
          دسته‌بندی‌های هزینه را مدیریت کنید
        </p>
      </div>

      <div className="max-w-2xl mx-auto" style={{ padding: dt.spacing[6], display: 'flex', flexDirection: 'column', gap: dt.spacing[4] }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
          {categories.map((category) => (
            <div
              key={category.id}
              className={getCardBackgroundClass()}
              style={{ borderRadius: dt.radius.xl, padding: dt.spacing[4], boxShadow: dt.shadow.card }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
                  {/* Color indicator */}
                  {category.color && (
                    <div
                      className="rounded-full"
                      style={{ width: 4, height: 32, backgroundColor: category.color }}
                    />
                  )}
                  {category.icon ? (
                    <span style={{ fontSize: dt.typography.sizes.display }}>{category.icon}</span>
                  ) : (
                    <FamilyIcon name="note" size={24} className="text-gray-400 dark:text-gray-600" />
                  )}
                  <span className={`font-medium ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                    {category.name}
                  </span>
                </div>

                {/* Menu button */}
                <div className="relative group">
                  <button
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    style={{ padding: dt.spacing[2], borderRadius: dt.radius.md }}
                  >
                    <FamilyIcon name="more" size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  <div
                    className="absolute left-0 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
                    style={{ marginTop: dt.spacing[1], width: 128, borderRadius: dt.radius.lg }}
                  >
                    <button
                      onClick={() => handleOpenEditor(category)}
                      className="w-full text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                      style={{ padding: `${dt.spacing[2]}px ${dt.spacing[4]}px`, gap: dt.spacing[2], borderTopLeftRadius: dt.radius.lg, borderTopRightRadius: dt.radius.lg }}
                    >
                      <FamilyIcon name="edit" size={16} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: dt.typography.sizes.body }}>ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleOpenDelete(category)}
                      className="w-full text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                      style={{ padding: `${dt.spacing[2]}px ${dt.spacing[4]}px`, gap: dt.spacing[2], borderBottomLeftRadius: dt.radius.lg, borderBottomRightRadius: dt.radius.lg }}
                    >
                      <FamilyIcon name="delete" size={16} style={{ color: dt.colors.semantic.expense }} />
                      <span style={{ fontSize: dt.typography.sizes.body, color: dt.colors.semantic.expense }}>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div
            className={`text-center ${getCardBackgroundClass()}`}
            style={{ borderRadius: dt.radius.xl, padding: dt.spacing[12], boxShadow: dt.shadow.card }}
          >
            <div
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                marginBottom: dt.spacing[4],
                backgroundColor: dt.colors.brand.primarySoft,
              }}
            >
              <FamilyIcon name="categories" size={36} style={{ color: dt.colors.brand.primary }} />
            </div>
            <p className={getTextColorClass('secondary')} style={{ marginBottom: dt.spacing[4], fontSize: dt.typography.sizes.body }}>
              هنوز دسته‌بندی‌ای ایجاد نشده است
            </p>
            <button
              onClick={() => handleOpenEditor()}
              className={`font-medium hover:underline ${getTextColorClass('danger')}`}
              style={{ fontSize: dt.typography.sizes.body }}
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
