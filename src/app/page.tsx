'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { getAllTemplates } from '@/lib/domain/templates'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProjectListItem {
  id: string
  name: string
  template: string
  currency: string
  participantCount: number
  expenseCount: number
  myParticipantId: string
  myName: string
  myRole: string
  createdAt: string
}

interface User {
  id: string
  name: string
  phone: string
}

export default function HomePage() {
  const router = useRouter()
  const templates = getAllTemplates()

  const [step, setStep] = useState<'home' | 'create'>('home')
  const [projectName, setProjectName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('travel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // User and projects state
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Load user and projects on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
        setUser(data.user || null)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
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
          name: projectName,
          template: selectedTemplate,
          ownerName: user?.name, // Will be set from logged-in user in API
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
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setProjects([])
    router.refresh()
  }

  const getTemplateIcon = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    return template?.icon || '📁'
  }

  // Create project form
  if (step === 'create') {
    return (
      <main className="min-h-dvh p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setStep('home')}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">پروژه جدید</h1>
        </div>

        <div className="space-y-4 flex-1">
          <Input
            label="نام پروژه"
            placeholder="مثلاً: سفر شمال"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع پروژه
            </label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-2xl block mb-1">{template.icon}</span>
                  <span className="text-sm font-medium">{template.nameFa}</span>
                </button>
              ))}

              <button
                disabled
                className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center opacity-50"
              >
                <span className="text-2xl block mb-1">🎉</span>
                <span className="text-sm text-gray-500">دورهمی (به‌زودی)</span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        <div className="mt-6">
          <Button
            onClick={handleCreateProject}
            loading={loading}
            className="w-full"
            size="lg"
          >
            ساخت پروژه
          </Button>
        </div>
      </main>
    )
  }

  // Main home page
  return (
    <main className="min-h-dvh p-4 flex flex-col">
      {/* Header with Profile & Settings */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user?.name?.[0] || '؟'}
          </div>
          <div>
            {user ? (
              <>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.phone}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm">کاربر مهمان</p>
                <Link href="/auth" className="text-xs text-blue-500">
                  ورود / ثبت‌نام
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="خروج"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Content */}
      {loadingData ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : !user ? (
        // Not logged in - Show login prompt
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-3xl font-bold mb-2">دنگی</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            تقسیم هزینه‌ها، ساده و سریع
          </p>

          <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">✈️</span>
              </div>
              <span className="text-xs text-gray-500">سفر</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🏢</span>
              </div>
              <span className="text-xs text-gray-500">ساختمان</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🎉</span>
              </div>
              <span className="text-xs text-gray-500">دورهمی</span>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <Link href="/auth">
              <Button className="w-full" size="lg">
                ورود / ثبت‌نام
              </Button>
            </Link>
            <p className="text-xs text-gray-400 text-center">
              برای استفاده از دنگی، ابتدا وارد شوید
            </p>
          </div>
        </div>
      ) : projects.length > 0 ? (
        // Logged in with projects
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">پروژه‌های شما</h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                      {getTemplateIcon(project.template)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {project.participantCount} نفر
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {project.expenseCount} هزینه
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        // Logged in but no projects
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-2">هنوز پروژه‌ای نداری</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            اولین پروژه‌ات رو بساز و شروع کن!
          </p>
        </div>
      )}

      {/* Actions (only show for logged in users) */}
      {user && (
        <div className="space-y-3 mt-4">
          <Button onClick={() => setStep('create')} className="w-full" size="lg">
            شروع پروژه جدید
          </Button>

          {projects.length === 0 && (
            <Card variant="bordered" className="text-center">
              <p className="text-sm text-gray-500 mb-2">لینک دعوت دارید؟</p>
              <p className="text-xs text-gray-400">
                برای پیوستن به پروژه، لینک یا QR Code را اسکن کنید
              </p>
            </Card>
          )}
        </div>
      )}
    </main>
  )
}
