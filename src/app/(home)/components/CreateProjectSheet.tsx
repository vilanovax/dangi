'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet, Button, Input } from '@/components/ui'
import { getAllTemplates } from '@/lib/domain/templates'

interface CreateProjectSheetProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
}

/**
 * Bottom sheet for creating new project
 * Includes template selection
 */
export function CreateProjectSheet({ isOpen, onClose, userName }: CreateProjectSheetProps) {
  const router = useRouter()
  const templates = getAllTemplates()

  const [name, setName] = useState('')
  const [template, setTemplate] = useState('travel')
  const [trackingMode, setTrackingMode] = useState<'split' | 'tracking'>('tracking') // Default: tracking mode
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError('لطفاً نام پروژه را وارد کنید')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          template,
          ownerName: userName,
          trackingOnly: template === 'personal' ? trackingMode === 'tracking' : false,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ساخت پروژه')
      }

      const data = await res.json()
      router.push(`/project/${data.project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ساخت پروژه')
    } finally {
      setLoading(false)
    }
  }, [name, template, userName, router])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="پروژه جدید">
      <div className="space-y-5">
        {/* Name Input */}
        <Input
          label="نام پروژه"
          placeholder="مثلاً: سفر شمال"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            نوع پروژه
          </label>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  template === t.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-3xl block mb-2">{t.icon}</span>
                <span className="text-sm font-medium">{t.nameFa}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection - فقط برای Personal Template */}
        {template === 'personal' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              این پروژه برای چیه؟
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setTrackingMode('tracking')}
                className={`w-full p-4 rounded-xl border-2 text-right transition-all ${
                  trackingMode === 'tracking'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👨‍👩‍👧</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">خانواده (فقط ردیابی)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      فقط مشخص میشه هر نفر چقدر خرج کرده، بدون تسویه
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTrackingMode('split')}
                className={`w-full p-4 rounded-xl border-2 text-right transition-all ${
                  trackingMode === 'split'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏠</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">هم‌خونه (تقسیم خرج)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      خرج‌ها بین اعضا تقسیم میشه و تسویه حساب انجام میشه
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button onClick={handleCreate} loading={loading} disabled={!name.trim()} className="w-full" size="lg">
          ساخت پروژه
        </Button>
      </div>
    </BottomSheet>
  )
}
