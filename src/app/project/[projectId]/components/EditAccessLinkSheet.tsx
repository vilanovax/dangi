'use client'

import { useState, useEffect } from 'react'
import { BottomSheet, Button, Input } from '@/components/ui'
import { AccessBadge } from '@/components/ui'
import type { ProjectAccessLink, UpdateAccessLinkInput } from '@/types/access-link'
import {
  EXPIRATION_PRESETS,
  calculateExpirationDate,
  getTemplateByRole,
  getLinkStatus,
  getLinkStatusLabel,
} from '@/types/access-link'

interface EditAccessLinkSheetProps {
  isOpen: boolean
  onClose: () => void
  link: ProjectAccessLink | null
  projectId: string
  onSuccess: () => void
}

/**
 * Edit Access Link Bottom Sheet
 * Edit existing link properties, view stats, toggle active status, delete
 */
export function EditAccessLinkSheet({
  isOpen,
  onClose,
  link,
  projectId,
  onSuccess,
}: EditAccessLinkSheetProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedExpiration, setSelectedExpiration] = useState<string>('no-expiration')
  const [maxUses, setMaxUses] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const template = link ? getTemplateByRole(link.role || 'viewer') : null
  const status = link ? getLinkStatus(link) : 'inactive'
  const statusLabel = link ? getLinkStatusLabel(link) : ''

  // Initialize form with link data
  useEffect(() => {
    if (link) {
      setName(link.name || '')
      setDescription(link.description || '')
      setIsActive(link.isActive)
      setMaxUses(link.maxUses?.toString() || '')

      // Determine expiration preset
      if (!link.expiresAt) {
        setSelectedExpiration('no-expiration')
      } else {
        const expiryDate = new Date(link.expiresAt)
        const now = new Date()
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Match to closest preset
        if (daysRemaining <= 1) {
          setSelectedExpiration('1-day')
        } else if (daysRemaining <= 7) {
          setSelectedExpiration('1-week')
        } else if (daysRemaining <= 30) {
          setSelectedExpiration('1-month')
        } else {
          setSelectedExpiration('no-expiration')
        }
      }
    }
  }, [link])

  const handleUpdate = async () => {
    if (!link) return

    setIsUpdating(true)
    try {
      const expirationPreset = EXPIRATION_PRESETS.find((p) => p.id === selectedExpiration)
      const expiresAt = expirationPreset?.days
        ? calculateExpirationDate(expirationPreset.days)
        : undefined

      const input: UpdateAccessLinkInput = {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        expiresAt,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        isActive,
      }

      const response = await fetch(`/api/projects/${projectId}/access-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'خطا در به‌روزرسانی لینک')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to update access link:', error)
      alert(error instanceof Error ? error.message : 'خطا در به‌روزرسانی لینک دسترسی')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!link) return

    const confirmed = confirm(
      'آیا از حذف این لینک اطمینان دارید؟\n\nاین عمل قابل بازگشت نیست و دسترسی افرادی که از این لینک استفاده می‌کنند قطع می‌شود.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/access-links/${link.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'خطا در حذف لینک')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to delete access link:', error)
      alert(error instanceof Error ? error.message : 'خطا در حذف لینک دسترسی')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!link) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ویرایش لینک دسترسی">
      <div className="space-y-6">
        {/* Link Info (Read-only) */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xl">
              {template?.icon || '🔗'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {template?.namePersian || 'لینک دسترسی'}
                </h3>
                {link.role && <AccessBadge type={link.role} size="sm" />}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {template?.descriptionPersian}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
            آمار استفاده
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-blue-700 dark:text-blue-300">تعداد استفاده</div>
              <div className="font-semibold text-blue-900 dark:text-blue-100 mt-1">
                {link.usedCount} / {link.maxUses || '∞'}
              </div>
            </div>
            <div>
              <div className="text-blue-700 dark:text-blue-300">وضعیت</div>
              <div className={`font-semibold mt-1 ${
                status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {statusLabel}
              </div>
            </div>
            {link.lastUsedAt && (
              <div className="col-span-2">
                <div className="text-blue-700 dark:text-blue-300">آخرین استفاده</div>
                <div className="font-semibold text-blue-900 dark:text-blue-100 mt-1">
                  {new Date(link.lastUsedAt).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            نام لینک (اختیاری)
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: لینک خانواده، لینک دوستان"
            className="w-full"
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="یادداشت یا توضیحات برای این لینک"
            rows={3}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
          />
        </div>

        {/* Expiration Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            انقضای لینک
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EXPIRATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedExpiration(preset.id)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  selectedExpiration === preset.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                {preset.labelPersian}
              </button>
            ))}
          </div>
        </div>

        {/* Max Uses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            حداکثر تعداد استفاده
          </label>
          <Input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="نامحدود"
            min="1"
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            اگر خالی بگذارید، تعداد استفاده نامحدود است
          </p>
        </div>

        {/* Active/Inactive Toggle */}
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                وضعیت لینک
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {isActive ? 'لینک فعال و قابل استفاده است' : 'لینک غیرفعال و غیرقابل استفاده است'}
              </p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive
                  ? 'bg-green-600 dark:bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Update Button */}
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? 'در حال به‌روزرسانی...' : 'ذخیره تغییرات'}
          </Button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'در حال حذف...' : 'حذف لینک'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
