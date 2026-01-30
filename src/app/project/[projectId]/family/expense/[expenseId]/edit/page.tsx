'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PersianDatePicker } from '@/components/ui/PersianDatePicker'
import { FamilyIcon } from '../../../components/FamilyIcon'
import { FamilyButton } from '../../../components/FamilyButton'

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

interface Expense {
  id: string
  title: string
  amount: number
  paidById: string
  categoryId?: string | null
  description?: string | null
  expenseDate: Date
  shares: { participantId: string }[]
}

export default function EditExpensePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const expenseId = params.expenseId as string

  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [expenseType, setExpenseType] = useState<'personal' | 'family'>('family')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())

  // Data state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingExpense, setFetchingExpense] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch expense data
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const [expenseRes, projectRes, categoriesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/expenses/${expenseId}`),
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/categories`),
        ])

        if (expenseRes.ok) {
          const expenseData = await expenseRes.json()
          const expense: Expense = expenseData.expense

          // Pre-fill form
          setTitle(expense.title)
          setAmount((expense.amount / 10).toString()) // Convert from rials to toman
          setCategoryId(expense.categoryId || '')
          setDescription(expense.description || '')
          setExpenseDate(new Date(expense.expenseDate))

          // Determine expense type
          if (expense.shares && expense.shares.length > 0) {
            setExpenseType(expense.shares.length > 1 ? 'family' : 'personal')
          }
        }

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
        console.error('Error fetching expense:', err)
        setError('خطا در بارگذاری هزینه')
      } finally {
        setFetchingExpense(false)
      }
    }

    fetchExpense()
  }, [projectId, expenseId])

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

      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: amountInRials,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
          expenseDate: new Date(expenseDate).toISOString(),
          includedParticipantIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ویرایش هزینه')
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

  if (fetchingExpense) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFDF8' }}>
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF8A00] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300" style={{ fontSize: '14px' }}>در حال بارگذاری...</p>
        </div>
      </div>
    )
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
            <FamilyIcon name="success" size={18} className="text-white" />
            <span>ویرایش شد</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800" style={{ padding: '16px 24px' }}>
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 -m-2"
            aria-label="بازگشت"
          >
            <FamilyIcon name="back" size={24} />
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '20px' }}>
            ویرایش هزینه
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PRIMARY SECTION */}
          <div className="space-y-4">
            {/* Amount */}
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

            {/* Title */}
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
                style={{ fontSize: '15px' }}
                disabled={loading}
              />
            </div>

            {/* For Who */}
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

          {/* SECONDARY SECTION */}
          <div className="space-y-4" style={{ paddingTop: '8px' }}>
            {/* Category */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm" style={{ padding: '20px' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-700 dark:text-gray-300 font-medium" style={{ fontSize: '14px' }}>
                  دسته‌بندی
                </label>
                <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>
                  اختیاری
                </span>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
            </div>

            {/* Date */}
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

            {/* Description */}
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

          {/* CTA */}
          <button
            type="submit"
            disabled={loading || !title.trim() || !amount}
            className="w-full text-white py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
            style={{
              backgroundColor: '#FF8A00',
              fontSize: '16px'
            }}
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </form>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: '80px' }}></div>
    </div>
  )
}
