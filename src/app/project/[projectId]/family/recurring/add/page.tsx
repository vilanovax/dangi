'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface Participant {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  icon?: string | null
}

export default function AddRecurringPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Form state
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<
    'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  >('MONTHLY')
  const [participantId, setParticipantId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState('')

  // Data state
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch participants and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [participantsRes, categoriesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/participants`),
          fetch(`/api/projects/${projectId}/categories`),
        ])

        if (participantsRes.ok) {
          const data = await participantsRes.json()
          setParticipants(data.participants || [])
          if (data.participants?.length > 0) {
            setParticipantId(data.participants[0].id)
          }
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data.categories || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('عنوان الزامی است')
      return
    }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('مبلغ باید عدد مثبت باشد')
      return
    }

    if (!participantId) {
      setError('انتخاب عضو الزامی است')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          amount: amountNum,
          frequency,
          participantId,
          categoryId: categoryId || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          isActive: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ثبت تراکنش تکراری')
      }

      // Success
      router.push(`/project/${projectId}/family/recurring`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت')
    } finally {
      setLoading(false)
    }
  }

  const frequencyOptions = [
    { value: 'DAILY', label: 'روزانه' },
    { value: 'WEEKLY', label: 'هفتگی' },
    { value: 'MONTHLY', label: 'ماهانه' },
    { value: 'YEARLY', label: 'سالانه' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">افزودن تراکنش تکراری</h1>
        </div>
        <p className="text-purple-100 text-sm mr-14">
          تراکنش تکراری جدید ایجاد کنید
        </p>
      </div>

      {/* Form */}
      <div className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              نوع تراکنش <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                💸 هزینه
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  type === 'INCOME'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                💰 درآمد
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'INCOME' ? 'مثلاً: حقوق ماهانه' : 'مثلاً: اجاره خانه'
              }
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              مبلغ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-left"
              disabled={loading}
            />
          </div>

          {/* Frequency */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              دوره تکرار <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {frequencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFrequency(
                      option.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
                    )
                  }
                  className={`py-3 rounded-xl font-medium transition-all ${
                    frequency === option.value
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Participant */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {type === 'INCOME' ? 'دریافت‌کننده' : 'پرداخت‌کننده'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">انتخاب کنید</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              دسته‌بندی
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">بدون دسته‌بندی</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              تاریخ شروع <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* End Date (optional) */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              تاریخ پایان (اختیاری)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-stone-500 mt-2">
              اگر خالی بگذارید، تراکنش به صورت نامحدود ادامه می‌یابد
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'در حال ثبت...' : '🔄 ایجاد تراکنش تکراری'}
          </Button>
        </form>
      </div>
    </div>
  )
}
