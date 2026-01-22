'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card, BottomSheet, Input } from '@/components/ui'
import { formatMoney, parseMoney } from '@/lib/utils/money'

interface Participant {
  id: string
  name: string
  weight: number
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Project {
  id: string
  name: string
  currency: string
  splitType: string
  template: string
  participants: Participant[]
  categories: Category[]
}

// Common expense categories for buildings
const COMMON_EXPENSE_TYPES = [
  { id: 'maintenance', icon: '🔧', name: 'تعمیرات', color: '#F59E0B' },
  { id: 'cleaning', icon: '🧹', name: 'نظافت', color: '#10B981' },
  { id: 'electricity', icon: '💡', name: 'برق مشاع', color: '#3B82F6' },
  { id: 'water', icon: '💧', name: 'آب مشاع', color: '#06B6D4' },
  { id: 'gas', icon: '🔥', name: 'گاز مشاع', color: '#EF4444' },
  { id: 'security', icon: '🔒', name: 'نگهبانی', color: '#8B5CF6' },
  { id: 'elevator', icon: '🛗', name: 'آسانسور', color: '#EC4899' },
  { id: 'parking', icon: '🚗', name: 'پارکینگ', color: '#6366F1' },
  { id: 'garden', icon: '🌿', name: 'فضای سبز', color: '#22C55E' },
  { id: 'other', icon: '📝', name: 'سایر', color: '#6B7280' },
]

export default function AddCommonExpensePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paidById, setPaidById] = useState('')

  // Payer selection modal
  const [showPayerSheet, setShowPayerSheet] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)

      // Set default payer (first participant, usually manager)
      if (data.project.participants.length > 0) {
        setPaidById(data.project.participants[0].id)
      }
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    const type = COMMON_EXPENSE_TYPES.find(t => t.id === typeId)
    if (type && !title) {
      setTitle(type.name)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!selectedType) {
      setError('نوع هزینه را انتخاب کنید')
      return
    }

    if (!title.trim()) {
      setError('عنوان را وارد کنید')
      return
    }

    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('مبلغ باید بیشتر از صفر باشد')
      return
    }

    if (!paidById) {
      setError('پرداخت‌کننده را انتخاب کنید')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // All participants are included (common expense)
      const includedParticipantIds = project?.participants.map(p => p.id) || []

      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          description: description.trim() || undefined,
          paidById,
          includedParticipantIds,
          // No periodKey - common expenses are not period-based
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ثبت هزینه')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/project/${projectId}/building`)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت هزینه')
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate share per unit
  const getSharePreview = () => {
    const parsedAmount = parseMoney(amount)
    if (!parsedAmount || !project) return null

    const totalWeight = project.participants.reduce((sum, p) => sum + p.weight, 0)
    return project.participants.map(p => ({
      id: p.id,
      name: p.name,
      share: (parsedAmount * p.weight) / totalWeight,
    }))
  }

  const selectedPayer = project?.participants.find(p => p.id === paidById)
  const sharePreview = getSharePreview()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 mb-4">{error || 'پروژه یافت نشد'}</p>
        <Button onClick={() => router.push('/')}>بازگشت</Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-950">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">هزینه ثبت شد</h2>
        <p className="text-gray-500">در حال بازگشت...</p>
      </div>
    )
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">ثبت هزینه عمومی</h1>
            <p className="text-orange-100 text-sm">هزینه‌های مشترک ساختمان</p>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-white/80 text-sm mb-1">این هزینه بین همه واحدها تقسیم می‌شود</p>
          <p className="text-white font-medium">{project.participants.length} واحد • بر اساس متراژ</p>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* 1. Expense Type Selection */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            نوع هزینه چیه؟
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COMMON_EXPENSE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  selectedType === type.id
                    ? 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">
                  {type.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Title */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            عنوان هزینه
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: تعمیر موتورخانه"
          />
          <p className="text-xs text-gray-400 mt-1">توضیح مختصری از هزینه</p>
        </section>

        {/* 3. Amount */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            مبلغ کل (تومان)
          </label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="۲٬۰۰۰٬۰۰۰"
            inputMode="numeric"
            className="text-left text-xl font-bold"
            dir="ltr"
          />
        </section>

        {/* 4. Paid By */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            پرداخت‌کننده
          </label>
          <button
            onClick={() => setShowPayerSheet(true)}
            className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <span className="font-semibold text-orange-600">
                  {selectedPayer?.name.charAt(0) || '?'}
                </span>
              </div>
              <span className="font-medium">{selectedPayer?.name || 'انتخاب کنید'}</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-xs text-gray-400 mt-1">معمولاً مدیر ساختمان یا صندوق‌دار</p>
        </section>

        {/* 5. Description (Optional) */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیحات تکمیلی در صورت نیاز..."
            className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 resize-none h-20"
          />
        </section>

        {/* Share Preview */}
        {sharePreview && parseMoney(amount) > 0 && (
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              سهم هر واحد
            </label>
            <Card className="divide-y divide-gray-100 dark:divide-gray-800">
              {sharePreview.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3">
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatMoney(item.share, project.currency)}
                  </span>
                </div>
              ))}
            </Card>
          </section>
        )}
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!selectedType || !title.trim() || !amount || !paidById}
          className="w-full !bg-orange-500 hover:!bg-orange-600"
          size="lg"
        >
          {submitting ? 'در حال ثبت...' : 'ثبت هزینه عمومی'}
        </Button>
      </div>

      {/* Payer Selection Sheet */}
      <BottomSheet
        isOpen={showPayerSheet}
        onClose={() => setShowPayerSheet(false)}
        title="انتخاب پرداخت‌کننده"
      >
        <div className="space-y-2">
          {project.participants.map((participant) => (
            <button
              key={participant.id}
              onClick={() => {
                setPaidById(participant.id)
                setShowPayerSheet(false)
              }}
              className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                paidById === participant.id
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="font-semibold">{participant.name.charAt(0)}</span>
                </div>
                <span className="font-medium">{participant.name}</span>
              </div>
              {paidById === participant.id && (
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </main>
  )
}
