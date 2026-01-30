'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { PersianDatePicker } from '@/components/ui/PersianDatePicker'
import { formatPersianDate } from '@/lib/utils/persian-date'
import {
  familyTheme,
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'
import { FamilyButton } from '../components/FamilyButton'
import { FamilyIcon } from '../components/FamilyIcon'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface IncomeCategory {
  id: string
  name: string
  icon?: string | null
}

export default function AddIncomePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [incomeDate, setIncomeDate] = useState<Date>(new Date())

  // Data state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [categories, setCategories] = useState<IncomeCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch current user and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, categoriesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/income-categories`),
        ])

        if (projectRes.ok) {
          const projectData = await projectRes.json()
          if (projectData.project?.participants?.[0]) {
            setCurrentUserId(projectData.project.participants[0].id)
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

  // Helper functions
  const formatNumberWithCommas = (num: string) => {
    const cleaned = num.replace(/\D/g, '')
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '')
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value)
    }
  }

  const setToday = () => {
    setIncomeDate(new Date())
  }

  const setYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setIncomeDate(yesterday)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('لطفاً یک عنوان وارد کن')
      return
    }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('مبلغ را وارد کن')
      return
    }

    if (!currentUserId) {
      setError('کاربر شناسایی نشد')
      return
    }

    setLoading(true)

    try {
      // تبدیل تومان به ریال (×10)
      const amountInRials = amountNum * 10

      const res = await fetch(`/api/projects/${projectId}/incomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: amountInRials,
          receivedById: currentUserId,
          categoryId: categoryId || undefined,
          source: source.trim() || undefined,
          description: description.trim() || undefined,
          incomeDate: new Date(incomeDate).toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ثبت درآمد')
      }

      // Success
      setSuccess(true)
      setTimeout(() => {
        router.push(`/project/${projectId}/family`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مشکلی پیش اومد، دوباره تلاش کن')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Success Toast */}
      {success && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 bg-[#22C55E] dark:bg-[#4ADE80]">
          <div className="flex items-center gap-2 font-bold">
            <FamilyIcon name="success" size={16} className="text-white" />
            <span>ثبت شد!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`text-white p-6 shadow-lg ${getHeaderGradient('primary')}`}>
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="بازگشت"
          >
            <FamilyIcon name="back" size={24} className="text-white" />
          </button>
          <h1 className="text-[22px] font-bold">
            ثبت درآمد
          </h1>
        </div>
        <p className="text-white/90 mr-14 text-sm flex items-center gap-2">
          <span>امروز چی دریافت کردی؟</span>
          <FamilyIcon name="income" size={16} className="text-white/90" />
        </p>
      </div>

      {/* Form */}
      <div className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. مبلغ (Hero Field) */}
          <div className={`rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-3 text-sm ${getTextColorClass('secondary')}`}>
              مبلغ <span className={getTextColorClass('danger')}>*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatNumberWithCommas(amount)}
                onChange={handleAmountChange}
                placeholder="مبلغ را وارد کن"
                className={`w-full font-bold bg-transparent border-none focus:outline-none text-right text-[36px] placeholder:text-gray-300 dark:placeholder:text-gray-600 ${getTextColorClass('success')}`}
                disabled={loading}
                autoFocus
              />
              <div className="mt-1 text-sm text-gray-400 dark:text-gray-600">
                تومان
              </div>
            </div>
          </div>

          {/* 2. عنوان */}
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-sm ${getTextColorClass('primary')}`}>
              عنوان <span className={getTextColorClass('danger')}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: حقوق ماهانه"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-transparent text-sm text-gray-900 dark:text-gray-100"
              disabled={loading}
            />
          </div>

          {/* 3. دسته‌بندی */}
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-sm ${getTextColorClass('primary')}`}>
              دسته‌بندی
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-transparent text-sm text-gray-900 dark:text-gray-100"
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

          {/* 4. منبع درآمد */}
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-sm ${getTextColorClass('primary')}`}>
              منبع درآمد (اختیاری)
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="مثلاً: شرکت، فریلنس، سرمایه‌گذاری"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-transparent text-sm text-gray-900 dark:text-gray-100"
              disabled={loading}
            />
          </div>

          {/* 5. تاریخ */}
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-sm ${getTextColorClass('primary')}`}>
              تاریخ
            </label>
            <div className="space-y-2">
              <PersianDatePicker
                value={incomeDate}
                onChange={setIncomeDate}
                disabled={loading}
                placeholder="انتخاب تاریخ"
                className="focus:ring-[#FF8A00]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={setToday}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-xs ${getTextColorClass('primary')}`}
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={setYesterday}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-xs ${getTextColorClass('primary')}`}
                >
                  دیروز
                </button>
              </div>
            </div>
          </div>

          {/* 6. توضیحات */}
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <label className={`block font-medium mb-2 text-sm ${getTextColorClass('primary')}`}>
              توضیحات (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اگر نکته‌ای هست اینجا بنویس..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-transparent resize-none text-sm text-gray-900 dark:text-gray-100"
              disabled={loading}
            />
          </div>

          {/* 7. نوت */}
          <div className="rounded-xl p-3 bg-[#EAFBF1] dark:bg-[#0F2417] border border-[#22C55E]/20 dark:border-[#4ADE80]/20">
            <div className="flex items-start gap-2">
              <FamilyIcon name="tip" size={16} className="text-[#22C55E] dark:text-[#4ADE80] flex-shrink-0 mt-0.5" />
              <div className={`text-xs ${getTextColorClass('success')}`}>
                این درآمد به نام شما ثبت می‌شود.
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 8. دکمه ثبت */}
          <FamilyButton
            type="submit"
            variant="success"
            size="lg"
            fullWidth
            disabled={loading || !title.trim() || !amount}
            loading={loading}
            icon="income"
          >
            {loading ? 'در حال ثبت...' : 'ثبت درآمد'}
          </FamilyButton>
        </form>
      </div>
    </div>
  )
}
