/**
 * Template Selection Page
 * Choose from pre-built checklist templates or create a blank checklist
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type {
  ChecklistTemplateCategory,
  ChecklistTemplate,
  ChecklistCategoryId,
} from '@/lib/domain/checklist-templates/types'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TemplatesResponse {
  categories: ChecklistTemplateCategory[]
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function NewChecklistPage() {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────
  const [categories, setCategories] = useState<ChecklistTemplateCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategoryId | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ── Fetch Templates ─────────────────────────────────────────
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/checklists/templates')
        if (!res.ok) throw new Error('Failed to fetch templates')
        const data: TemplatesResponse = await res.json()
        setCategories(data.categories)
      } catch (error) {
        console.error('Error fetching templates:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  // ── Filter Templates ────────────────────────────────────────
  const filteredCategories =
    selectedCategory === 'all'
      ? categories
      : categories.filter((cat) => cat.id === selectedCategory)

  const allTemplates = filteredCategories.flatMap((cat) => cat.templates)

  // ── Create from Template ────────────────────────────────────
  const handleCreateFromTemplate = async (templateId: string) => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
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

  // ── Loading State ───────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl mb-6 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── Main Render ─────────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-5 pb-24">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            بازگشت
          </button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ایجاد چک‌لیست جدید
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            از تمپلیت‌های آماده استفاده کنید یا یک چک‌لیست خالی بسازید
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            همه تمپلیت‌ها
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
              }`}
              style={
                selectedCategory === cat.id
                  ? {}
                  : { borderLeft: `3px solid ${cat.color}` }
              }
            >
              <span>{cat.icon}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Blank Checklist Option */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/checklists/new/blank')}
            className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 text-right hover:shadow-xl transition-all border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-400/20 to-gray-500/20 flex items-center justify-center text-3xl">
                ✏️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  ایجاد از ابتدا
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  یک چک‌لیست خالی بسازید و خودتان آیتم‌ها را اضافه کنید
                </p>
              </div>
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Templates Grid */}
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              {selectedCategory === 'all' && (
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                    {category.title}
                  </h2>
                  <span className="text-2xl">{category.icon}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 text-right hover:shadow-xl transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02]"
                    style={{
                      borderRight: `4px solid ${template.color}`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                        style={{
                          backgroundColor: `${template.color}20`,
                        }}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {template.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                            {template.items.length} مورد
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {allTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              تمپلیتی برای این دسته وجود ندارد
            </p>
          </div>
        )}
      </div>

      {/* Template Preview Bottom Sheet */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${selectedTemplate.color}20` }}
                  >
                    {selectedTemplate.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedTemplate.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTemplate.items.length} مورد
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Preview Items */}
            <div className="p-5 space-y-2">
              {selectedTemplate.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl"
                >
                  <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.text}</p>
                    {item.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-5">
              <Button
                onClick={() => handleCreateFromTemplate(selectedTemplate.id)}
                disabled={isCreating}
                className="w-full !bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700"
                size="lg"
              >
                {isCreating ? 'در حال ایجاد...' : 'استفاده از این تمپلیت'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
