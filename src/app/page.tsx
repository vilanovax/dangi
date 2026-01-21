'use client'

import { useState } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { getAllTemplates } from '@/lib/domain/templates'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const templates = getAllTemplates()

  const [step, setStep] = useState<'home' | 'create'>('home')
  const [projectName, setProjectName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('travel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateProject = async () => {
    if (!projectName.trim() || !ownerName.trim()) {
      setError('لطفاً همه فیلدها را پر کنید')
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
          ownerName,
          template: selectedTemplate,
        }),
      })

      if (!res.ok) throw new Error('خطا در ساخت پروژه')

      const data = await res.json()
      router.push(`/project/${data.project.id}`)
    } catch {
      setError('خطا در ساخت پروژه. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'create') {
    return (
      <main className="min-h-dvh p-4 flex flex-col">
        {/* Header */}
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

        {/* Form */}
        <div className="space-y-4 flex-1">
          <Input
            label="نام پروژه"
            placeholder="مثلاً: سفر شمال"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />

          <Input
            label="نام شما"
            placeholder="نامتان را وارد کنید"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
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

              {/* Coming Soon Templates */}
              <button
                disabled
                className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center opacity-50"
              >
                <span className="text-2xl block mb-1">🏢</span>
                <span className="text-sm text-gray-500">ساختمان (به‌زودی)</span>
              </button>
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

        {/* Submit Button */}
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

  return (
    <main className="min-h-dvh p-4 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-3xl font-bold mb-2">دنگی</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          تقسیم هزینه‌ها، ساده و سریع
        </p>

        {/* Features */}
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
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={() => setStep('create')} className="w-full" size="lg">
          شروع پروژه جدید
        </Button>

        <Card variant="bordered" className="text-center">
          <p className="text-sm text-gray-500 mb-2">لینک دعوت دارید؟</p>
          <p className="text-xs text-gray-400">
            برای پیوستن به پروژه، لینک یا QR Code را اسکن کنید
          </p>
        </Card>
      </div>
    </main>
  )
}
