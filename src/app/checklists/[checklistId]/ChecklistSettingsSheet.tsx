/**
 * Checklist Settings Sheet
 * Edit checklist metadata and reset to template defaults
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import type { Checklist } from '@/types/checklist'
import { getTemplateById, getTemplatesByCategory } from '@/lib/domain/checklist-templates'
import type { ChecklistTemplate } from '@/lib/domain/checklist-templates'

interface ChecklistSettingsSheetProps {
  checklist: Checklist
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedChecklist: Checklist) => void
}

export function ChecklistSettingsSheet({
  checklist,
  isOpen,
  onClose,
  onUpdate,
}: ChecklistSettingsSheetProps) {
  // ── State ───────────────────────────────────────────────────
  const [title, setTitle] = useState(checklist.title)
  const [description, setDescription] = useState(checklist.description || '')
  const [icon, setIcon] = useState(checklist.icon || '')
  const [color, setColor] = useState(checklist.color || '#3b82f6')
  const [isSaving, setIsSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])

  // ── Effects ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTitle(checklist.title)
      setDescription(checklist.description || '')
      setIcon(checklist.icon || '')
      setColor(checklist.color || '#3b82f6')
      // Load templates from the same category
      const categoryTemplates = getTemplatesByCategory(checklist.category)
      setTemplates(categoryTemplates)
    }
  }, [isOpen, checklist])

  // ── Save Settings ───────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      alert('لطفاً عنوان را وارد کنید')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/checklists/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          icon: icon.trim() || null,
          color: color || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to update checklist')

      const data = await res.json()
      onUpdate(data.checklist)
      onClose()
    } catch (error) {
      console.error('Error updating checklist:', error)
      alert('خطا در ذخیره تنظیمات')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Reset to Template ───────────────────────────────────────
  const handleResetToTemplate = async (templateId: string) => {
    if (!confirm('آیا می‌خواهید این چک‌لیست را به تنظیمات اولیه تمپلیت بازگردانید؟ تمام آیتم‌های فعلی حذف و با آیتم‌های تمپلیت جایگزین می‌شوند.')) {
      return
    }

    const template = getTemplateById(templateId)
    if (!template) {
      alert('تمپلیت یافت نشد')
      return
    }

    setIsSaving(true)
    try {
      // Update checklist metadata
      const updateRes = await fetch(`/api/checklists/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.title,
          description: template.description || null,
          icon: template.icon,
          color: template.color,
        }),
      })

      if (!updateRes.ok) throw new Error('Failed to update checklist')

      // Delete all existing items
      const deletePromises = (checklist.items || []).map((item) =>
        fetch(`/api/checklists/${checklist.id}/items/${item.id}`, {
          method: 'DELETE',
        })
      )
      await Promise.all(deletePromises)

      // Create new items from template
      const createPromises = template.items.map((item, index) =>
        fetch(`/api/checklists/${checklist.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: item.text,
            note: item.note || null,
            order: index,
          }),
        })
      )
      await Promise.all(createPromises)

      // Refresh the page to show updated checklist
      window.location.reload()
    } catch (error) {
      console.error('Error resetting to template:', error)
      alert('خطا در بازگردانی به تمپلیت')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            تنظیمات چک‌لیست
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              اطلاعات اصلی
            </h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عنوان
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="عنوان چک‌لیست"
                maxLength={100}
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
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="توضیحات کوتاه درباره چک‌لیست"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                آیکون (emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl text-center"
                placeholder="📋"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                یک emoji وارد کنید (مثلاً: ✈️ 🎉 💰)
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رنگ
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Template Reset */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    بازگردانی به تمپلیت اولیه
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    انتخاب تمپلیت از دسته "{checklist.category}"
                  </div>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Templates List */}
            {showTemplates && (
              <div className="mt-3 space-y-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    تمپلیتی برای این دسته یافت نشد
                  </p>
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleResetToTemplate(template.id)}
                      disabled={isSaving}
                      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${template.color}20` }}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {template.title}
                        </div>
                        {template.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {template.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {template.items.length} آیتم
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          <Button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 !bg-gray-200 dark:!bg-gray-800 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-300 dark:hover:!bg-gray-700"
          >
            انصراف
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            loading={isSaving}
            className="flex-1"
          >
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </div>
  )
}
