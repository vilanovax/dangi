'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import {
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'

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
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header */}
      <div className={`text-white p-6 shadow-lg ${getHeaderGradient('info')}`}>
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ←
          </button>
          <h1 className="text-[22px] font-bold">
            افزودن تراکنش تکراری
          </h1>
        </div>
        <p className="text-white/90 mr-14 text-[14px]">
          تراکنش تکراری جدید ایجاد کنید
        </p>
      </div>

      {/* Form */}
      <div className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-3 text-[14px] ${getTextColorClass('primary')}`}>
              نوع تراکنش <span className={getTextColorClass('danger')}>*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all text-[14px] ${
                  type === 'EXPENSE'
                    ? 'bg-[#EF4444] dark:bg-[#F87171] text-white shadow-sm'
                    : 'bg-[#FFFDF8] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#CBD5E1]'
                }`}
              >
                💸 هزینه
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all text-[14px] ${
                  type === 'INCOME'
                    ? 'bg-[#22C55E] dark:bg-[#4ADE80] text-white shadow-sm'
                    : 'bg-[#FFFDF8] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#CBD5E1]'
                }`}
              >
                💰 درآمد
              </button>
            </div>
          </div>

          {/* Title */}
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
              عنوان <span className={getTextColorClass('danger')}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'INCOME' ? 'مثلاً: حقوق ماهانه' : 'مثلاً: اجاره خانه'
              }
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
              disabled={loading}
            />
          </div>

          {/* Amount */}
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
              مبلغ <span className={getTextColorClass('danger')}>*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-left bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
              disabled={loading}
            />
          </div>

          {/* Frequency */}
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-3 text-[14px] ${getTextColorClass('primary')}`}>
              دوره تکرار <span className={getTextColorClass('danger')}>*</span>
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
                  className={`py-3 rounded-xl font-medium transition-all text-[14px] ${
                    frequency === option.value
                      ? 'bg-[#4F6EF7] dark:bg-[#818CF8] text-white shadow-sm'
                      : 'bg-[#FFFDF8] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#CBD5E1]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Participant */}
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
              {type === 'INCOME' ? 'دریافت‌کننده' : 'پرداخت‌کننده'}{' '}
              <span className={getTextColorClass('danger')}>*</span>
            </label>
            <select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
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
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
              دسته‌بندی
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
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
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
              تاریخ شروع <span className={getTextColorClass('danger')}>*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
              disabled={loading}
            />
          </div>

          {/* End Date (optional) */}
          <div className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-[14px] ${getTextColorClass('primary')}`}>
              تاریخ پایان (اختیاری)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px]"
              disabled={loading}
            />
            <p className={`mt-2 text-[12px] ${getTextColorClass('secondary')}`}>
              اگر خالی بگذارید، تراکنش به صورت نامحدود ادامه می‌یابد
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#FEECEC] dark:bg-[#2D1212] border border-[#EF4444]/20 dark:border-[#F87171]/20 text-[#EF4444] dark:text-[#F87171]">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4F6EF7] dark:bg-[#818CF8] text-white py-4 rounded-xl font-bold text-[15px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'در حال ثبت...' : '🔄 ایجاد تراکنش تکراری'}
          </Button>
        </form>
      </div>
    </div>
  )
}
