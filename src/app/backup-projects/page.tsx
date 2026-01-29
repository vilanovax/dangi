'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAllTemplates } from '@/lib/domain/templates'
import { formatMoney } from '@/lib/utils/money'

interface Project {
  id: string
  name: string
  template: string
  participantCount: number
  expenseCount: number
  totalExpenses: number
  myBalance: number
  currency: string
  isArchived: boolean
}

export default function BackupProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const templates = getAllTemplates()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          // فیلتر کردن فقط پروژه‌های فعال (غیر آرشیو)
          const activeProjects = (data.projects || []).filter((p: Project) => !p.isArchived)
          setProjects(activeProjects)
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDownloadBackup = async (projectId: string, projectName: string) => {
    setDownloadingId(projectId)
    try {
      const res = await fetch(`/api/projects/${projectId}/backup`)

      if (!res.ok) {
        throw new Error('خطا در دانلود بک‌آپ')
      }

      // دریافت blob
      const blob = await res.blob()

      // ایجاد URL موقت
      const url = window.URL.createObjectURL(blob)

      // ایجاد لینک دانلود
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName.replace(/[^a-zA-Z0-9-_\u0600-\u06FF]/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()

      // پاک کردن
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast('success', 'بک‌آپ با موفقیت دانلود شد')
    } catch (err) {
      console.error('Error downloading backup:', err)
      showToast('error', 'خطا در دانلود بک‌آپ')
    } finally {
      setDownloadingId(null)
    }
  }

  const getTemplateInfo = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    return {
      icon: template?.icon || '📁',
      name: template?.nameFa || 'پروژه',
      gradient: getTemplateGradient(templateId),
    }
  }

  const getTemplateGradient = (templateId: string) => {
    const gradients: Record<string, string> = {
      travel: 'from-sky-500 to-blue-600',
      building: 'from-purple-500 to-pink-600',
      gathering: 'from-amber-500 to-orange-600',
      personal: 'from-emerald-500 to-teal-600',
      family: 'from-amber-500 to-orange-600',
    }
    return gradients[templateId] || gradients.travel
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="p-5">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/50 dark:bg-gray-800/50 rounded-3xl" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-gradient-to-br from-blue-400/15 to-cyan-500/15 rounded-full blur-3xl" />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 left-4 right-4 z-50 p-4 rounded-2xl shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white'
              : 'bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${toast.type === 'success' ? 'bg-white/20' : 'bg-white/20'} flex items-center justify-center`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

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
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              بک‌آپ از پروژه‌ها
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {projects.length > 0 ? `${projects.length} پروژه فعال` : 'هیچ پروژه‌ای وجود ندارد'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5 pb-32">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-3xl blur-xl opacity-30" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-200 dark:from-indigo-900 dark:to-blue-800 flex items-center justify-center shadow-xl">
                <svg className="w-12 h-12 text-indigo-500 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              هیچ پروژه‌ای برای بک‌آپ وجود ندارد
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              ابتدا یک پروژه ایجاد کنید تا بتوانید از آن بک‌آپ بگیرید
            </p>

            {/* Back to home */}
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium hover:shadow-lg transition-shadow">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              برو به صفحه اصلی
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const templateInfo = getTemplateInfo(project.template)
              const isDownloading = downloadingId === project.id

              return (
                <div
                  key={project.id}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Template Icon */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${templateInfo.gradient} flex items-center justify-center shadow-md`}>
                        <span className="text-3xl">{templateInfo.icon}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {templateInfo.name} • {project.participantCount} نفر • {project.expenseCount} خرج
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">مجموع خرج‌ها</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatMoney(project.totalExpenses, project.currency)}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">موجودی شما</p>
                        <p className={`text-sm font-bold ${
                          project.myBalance === 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : project.myBalance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {formatMoney(Math.abs(project.myBalance), project.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadBackup(project.id, project.name)}
                      disabled={isDownloading}
                      className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all ${
                        isDownloading
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          در حال دانلود...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          دانلود بک‌آپ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        {projects.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                  نکات مهم
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• بک‌آپ شامل تمام اطلاعات پروژه، شرکت‌کنندگان، خرج‌ها و تسویه‌هاست</li>
                  <li>• فایل به فرمت JSON دانلود می‌شود</li>
                  <li>• این فایل را در جای امنی نگهداری کنید</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
