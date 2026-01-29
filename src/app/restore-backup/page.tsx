'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BackupData {
  exportedAt: string
  version: string
  project: {
    name: string
    template: string
    currency: string
    trackingOnly: boolean
  }
  participants: Array<{ name: string }>
  categories: Array<{ nameFa: string }>
  expenses: Array<{ title: string; amount: number }>
  settlements: Array<{ amount: number }>
}

export default function RestoreBackupPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [backupData, setBackupData] = useState<BackupData | null>(null)
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError('')
    setBackupData(null)
    setSuccess(false)

    // بررسی نوع فایل
    if (!selectedFile.name.endsWith('.json')) {
      setError('لطفاً یک فایل JSON انتخاب کنید')
      return
    }

    setLoading(true)
    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)

      // بررسی ساختار بک‌آپ
      if (!data.version || !data.project || !data.participants) {
        throw new Error('فایل بک‌آپ معتبر نیست')
      }

      setBackupData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در خواندن فایل')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRestore = useCallback(async () => {
    if (!file || !backupData) return

    setRestoring(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('backup', file)

      const res = await fetch('/api/projects/restore', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در بازگردانی بک‌آپ')
      }

      const data = await res.json()
      setSuccess(true)

      // هدایت به پروژه جدید بعد از 2 ثانیه
      setTimeout(() => {
        router.push(`/project/${data.projectId}`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بازگردانی بک‌آپ')
    } finally {
      setRestoring(false)
    }
  }, [file, backupData, router])

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-gradient-to-br from-blue-400/15 to-indigo-500/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-10 px-5 py-4 border-b border-white/50 dark:border-gray-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 -mr-2 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              بازگردانی بک‌آپ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              بازگردانی پروژه از فایل بک‌آپ
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5 max-w-2xl mx-auto">
        {/* Upload Section */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm p-6 mb-5">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading || restoring}
            />

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              {file ? (
                <>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    انتخاب فایل بک‌آپ
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    فایل JSON بک‌آپ را انتخاب کنید
                  </p>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm p-6 mb-5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">در حال خواندن فایل...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-3xl p-6 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-200 mb-1">خطا</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-3xl p-6 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 dark:text-green-200 mb-1">موفقیت!</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  بک‌آپ با موفقیت بازگردانی شد. در حال هدایت به پروژه...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {backupData && !success && (
          <>
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm p-6 mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">اطلاعات بک‌آپ</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">نام پروژه</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{backupData.project.name}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">تاریخ بک‌آپ</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(backupData.exportedAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">تعداد اعضا</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {backupData.participants.length} نفر
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">تعداد خرج‌ها</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {backupData.expenses.length} خرج
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">تعداد دسته‌بندی</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {backupData.categories.length} دسته
                  </span>
                </div>
              </div>
            </div>

            {/* Restore Button */}
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {restoring ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال بازگردانی...
                </span>
              ) : (
                'بازگردانی پروژه'
              )}
            </button>

            {/* Warning */}
            <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>توجه:</strong> این عمل یک پروژه جدید با اطلاعات بک‌آپ ایجاد می‌کند. پروژه‌های قبلی شما تغییر نمی‌کنند.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
