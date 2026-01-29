'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProjectCard, EmptyState } from '@/app/(home)/components'
import { getAllTemplates } from '@/lib/domain/templates'

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
  archivedAt?: string | null
}

export default function ArchivedProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const templates = getAllTemplates()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          // فیلتر کردن فقط پروژه‌های آرشیو شده
          const archivedProjects = (data.projects || []).filter((p: Project) => p.isArchived)
          setProjects(archivedProjects)
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const getTemplateInfo = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    return {
      icon: template?.icon || '📁',
      name: template?.nameFa || 'پروژه',
    }
  }

  const handleUnarchive = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      })

      if (res.ok) {
        // حذف پروژه از لیست
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
      }
    } catch (err) {
      console.error('Error unarchiving project:', err)
    }
  }

  const handleDelete = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
      }
    } catch (err) {
      console.error('Error deleting project:', err)
    }
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-400/20 to-slate-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-gradient-to-br from-gray-400/15 to-slate-500/15 rounded-full blur-3xl" />
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              پروژه‌های آرشیو شده
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {projects.length > 0 ? `${projects.length} پروژه آرشیو شده` : 'هیچ پروژه‌ای آرشیو نشده'}
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
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl blur-xl opacity-30" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-xl">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              هیچ پروژه‌ای آرشیو نشده
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              پروژه‌های قدیمی که آرشیو می‌کنید اینجا نمایش داده می‌شوند
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
              return (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  template={project.template}
                  templateName={templateInfo.name}
                  templateIcon={templateInfo.icon}
                  participantCount={project.participantCount}
                  expenseCount={project.expenseCount}
                  totalExpenses={project.totalExpenses}
                  myBalance={project.myBalance}
                  currency={project.currency}
                  isArchived={project.isArchived}
                  onArchive={(id, isArchived) => {
                    if (!isArchived) {
                      // از آرشیو خارج شد
                      handleUnarchive(id)
                    }
                  }}
                  onDelete={handleDelete}
                />
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
