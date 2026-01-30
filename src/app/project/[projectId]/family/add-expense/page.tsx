'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PersianDatePicker } from '@/components/ui/PersianDatePicker'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon?: string | null
}

export default function AddExpensePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [expenseType, setExpenseType] = useState<'personal' | 'family'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expense-type-preference')
      if (saved === 'personal' || saved === 'family') {
        return saved
      }
    }
    return 'family'
  })
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())

  // Data state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Recent categories state
  const [recentCategoryIds, setRecentCategoryIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recent-categories')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Fetch current user and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, categoriesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/categories`),
        ])

        if (projectRes.ok) {
          const projectData = await projectRes.json()
          if (projectData.project?.participants?.[0]) {
            setCurrentUserId(projectData.project.participants[0].id)
          }
          if (projectData.project?.participants) {
            setParticipants(projectData.project.participants)
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

  // Save expense type preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('expense-type-preference', expenseType)
    }
  }, [expenseType])

  // Save recent categories to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent-categories', JSON.stringify(recentCategoryIds))
    }
  }, [recentCategoryIds])

  // Update recent categories when a category is selected
  const handleCategorySelect = (selectedCategoryId: string) => {
    setCategoryId(selectedCategoryId)

    if (selectedCategoryId) {
      setRecentCategoryIds(prev => {
        // Remove if already exists
        const filtered = prev.filter(id => id !== selectedCategoryId)
        // Add to beginning
        const updated = [selectedCategoryId, ...filtered]
        // Keep only 3 most recent
        return updated.slice(0, 3)
      })
    }
  }

  // Get recent categories objects
  const recentCategories = recentCategoryIds
    .map(id => categories.find(c => c.id === id))
    .filter((c): c is Category => c !== undefined)
    .slice(0, 3)

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
    setExpenseDate(new Date())
  }

  const setYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setExpenseDate(yesterday)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
      const amountInRials = amountNum * 10

      const includedParticipantIds =
        expenseType === 'family'
          ? participants.map(p => p.id)
          : [currentUserId]

      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: amountInRials,
          paidById: currentUserId,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
          expenseDate: new Date(expenseDate).toISOString(),
          includedParticipantIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ثبت هزینه')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/project/${projectId}/family`)
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مشکلی پیش اومد، دوباره تلاش کن')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFDF8' }}>
      {/* Success Toast */}
      {success && (
        <div
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 text-white px-6 py-3 rounded-2xl shadow-lg animate-in slide-in-from-top-4"
          style={{ backgroundColor: '#22C55E' }}
        >
          <div className="flex items-center gap-2 font-semibold" style={{ fontSize: '14px' }}>
            <span>✓</span>
            <span>ثبت شد</span>
          </div>
        </div>
      )}

      {/* Header - Minimal */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800" style={{ padding: '16px 24px' }}>
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 -m-2"
            aria-label="بازگشت"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '20px' }}>
            ثبت هزینه
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PRIMARY SECTION - Above the fold */}
          <div className="space-y-4">
            {/* 1. Amount (Hero Input) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '32px 24px' }}>
              <label className="block text-gray-500 dark:text-gray-400 mb-2" style={{ fontSize: '13px' }}>
                مبلغ
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatNumberWithCommas(amount)}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full font-extrabold bg-transparent border-none focus:outline-none text-right placeholder:text-gray-200 dark:placeholder:text-gray-700 text-gray-900 dark:text-white"
                  style={{ fontSize: '44px', lineHeight: '1.2' }}
                  disabled={loading}
                  autoFocus
                />
                <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '14px', marginTop: '4px' }}>
                  تومان
                </div>
              </div>
            </div>

            {/* 2. Title */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" style={{ fontSize: '14px' }}>
                برای چی؟
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: شام رستوران"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 dark:text-gray-100"
                style={{ fontSize: '15px', focusRingColor: '#FF8A00' }}
                disabled={loading}
              />
            </div>

            {/* 3. For Who? (Compact Segmented Control) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-3" style={{ fontSize: '14px' }}>
                برای کی؟
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setExpenseType('family')}
                  disabled={loading}
                  className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                  style={{
                    fontSize: '14px',
                    backgroundColor: expenseType === 'family' ? '#FF8A00' : 'transparent',
                    color: expenseType === 'family' ? 'white' : '#6B7280'
                  }}
                >
                  خانواده
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType('personal')}
                  disabled={loading}
                  className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                  style={{
                    fontSize: '14px',
                    backgroundColor: expenseType === 'personal' ? '#FF8A00' : 'transparent',
                    color: expenseType === 'personal' ? 'white' : '#6B7280'
                  }}
                >
                  فقط من
                </button>
              </div>
              {expenseType === 'personal' && (
                <p className="text-gray-500 dark:text-gray-400 mt-2" style={{ fontSize: '12px' }}>
                  این هزینه فقط به نام شما ثبت می‌شود
                </p>
              )}
            </div>
          </div>

          {/* SECONDARY SECTION - Optional fields */}
          <div className="space-y-4" style={{ paddingTop: '8px' }}>
            {/* 4. Category */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-700 dark:text-gray-300 font-medium" style={{ fontSize: '14px' }}>
                  دسته‌بندی
                </label>
                <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>
                  اختیاری
                </span>
              </div>

              {/* Recent Categories Chips */}
              {recentCategories.length > 0 && (
                <div className="mb-3">
                  <p className="text-gray-500 dark:text-gray-400 mb-2" style={{ fontSize: '12px' }}>
                    دسته‌های اخیر
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category.id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all border"
                        style={{
                          fontSize: '13px',
                          backgroundColor: categoryId === category.id ? 'rgba(255, 138, 0, 0.1)' : '#F9FAFB',
                          borderColor: categoryId === category.id ? '#FF8A00' : '#E5E7EB',
                          color: categoryId === category.id ? '#FF8A00' : '#6B7280'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl transition-all border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{ fontSize: '13px', color: '#6B7280' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="font-medium">بیشتر</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Category Dropdown */}
              {(showAllCategories || recentCategories.length === 0) && (
                <select
                  value={categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 dark:text-gray-100"
                  style={{ fontSize: '14px' }}
                  disabled={loading}
                >
                  <option value="">انتخاب کنید</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 5. Date */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-700 dark:text-gray-300 font-medium" style={{ fontSize: '14px' }}>
                  تاریخ
                </label>
                <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>
                  اختیاری
                </span>
              </div>
              <div className="space-y-2">
                <PersianDatePicker
                  value={expenseDate}
                  onChange={setExpenseDate}
                  disabled={loading}
                  placeholder="انتخاب تاریخ"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={setToday}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                    style={{ fontSize: '13px' }}
                  >
                    امروز
                  </button>
                  <button
                    type="button"
                    onClick={setYesterday}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                    style={{ fontSize: '13px' }}
                  >
                    دیروز
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Description */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-700 dark:text-gray-300 font-medium" style={{ fontSize: '14px' }}>
                  توضیحات
                </label>
                <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>
                  اختیاری
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="یادداشت کوتاه..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent resize-none text-gray-900 dark:text-gray-100"
                style={{ fontSize: '14px' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl" style={{ fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* CTA - Simple and calm */}
          <button
            type="submit"
            disabled={loading || !title.trim() || !amount}
            className="w-full text-white py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
            style={{
              backgroundColor: '#FF8A00',
              fontSize: '16px'
            }}
          >
            {loading ? 'در حال ثبت...' : 'ثبت خرج'}
          </button>
        </form>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: '80px' }}></div>
    </div>
  )
}
