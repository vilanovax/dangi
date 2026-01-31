'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PersianDatePicker } from '@/components/ui/PersianDatePicker'
import { FamilyButton } from '../components/FamilyButton'
import { FamilyIcon } from '../components/FamilyIcon'
import { FamilyInput } from '../components/FamilyInput'
import { designTokens as dt } from '@/styles/design-tokens'
import { getBackgroundClass, getTextColorClass } from '@/styles/family-theme'

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
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Success Toast */}
      {success && (
        <div
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 text-white shadow-lg animate-in slide-in-from-top-4"
          style={{
            backgroundColor: dt.colors.semantic.income,
            paddingLeft: dt.spacing[6],
            paddingRight: dt.spacing[6],
            paddingTop: dt.spacing[3],
            paddingBottom: dt.spacing[3],
            borderRadius: dt.radius.lg
          }}
        >
          <div
            className="flex items-center font-semibold"
            style={{
              gap: dt.spacing[2],
              fontSize: dt.typography.sizes.body
            }}
          >
            <FamilyIcon name="success" size={16} className="text-white" />
            <span>ثبت شد</span>
          </div>
        </div>
      )}

      {/* Header - Minimal */}
      <div
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800"
        style={{
          padding: dt.spacing[4],
          paddingLeft: dt.spacing[6],
          paddingRight: dt.spacing[6]
        }}
      >
        <div className="flex items-center max-w-2xl mx-auto" style={{ gap: dt.spacing[3] }}>
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 -m-2"
            aria-label="بازگشت"
          >
            <FamilyIcon name="back" size={24} />
          </button>
          <h1
            className={`font-bold ${getTextColorClass('primary')}`}
            style={{ fontSize: dt.typography.sizes.headline }}
          >
            ثبت هزینه
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto" style={{ padding: dt.layout.sectionGap }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[6] }}>
          {/* PRIMARY SECTION - Above the fold */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[4] }}>
            {/* 1. Amount (Hero Input) */}
            <div
              className="bg-white dark:bg-gray-900"
              style={{
                borderRadius: dt.radius.lg,
                boxShadow: dt.shadow.card,
                padding: `${dt.spacing[8]}px ${dt.spacing[6]}px`
              }}
            >
              <label
                className={`block ${getTextColorClass('secondary')}`}
                style={{
                  fontSize: dt.typography.sizes.caption,
                  marginBottom: dt.spacing[2]
                }}
              >
                مبلغ
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatNumberWithCommas(amount)}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className={`w-full font-extrabold leading-tight bg-transparent border-none focus:outline-none text-right placeholder:text-gray-200 dark:placeholder:text-gray-700 ${getTextColorClass('primary')}`}
                  style={{ fontSize: 44 }}
                  disabled={loading}
                  autoFocus
                />
                <div
                  className={`mt-1 ${getTextColorClass('secondary')}`}
                  style={{ fontSize: dt.typography.sizes.body }}
                >
                  تومان
                </div>
              </div>
            </div>

            {/* 2. Title */}
            <div
              className="bg-white dark:bg-gray-900"
              style={{
                borderRadius: dt.radius.lg,
                boxShadow: dt.shadow.card,
                padding: dt.spacing[5]
              }}
            >
              <label
                className={`block font-medium ${getTextColorClass('primary')}`}
                style={{
                  fontSize: dt.typography.sizes.body,
                  marginBottom: dt.spacing[2]
                }}
              >
                برای چی؟
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: شام رستوران"
                className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:border-transparent ${getTextColorClass('primary')}`}
                style={{
                  fontSize: dt.typography.sizes.bodyLarge,
                  padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
                  borderRadius: dt.radius.md,
                  outlineColor: dt.colors.brand.primary
                }}
                disabled={loading}
              />
            </div>

            {/* 3. For Who? (Compact Segmented Control) */}
            <div
              className="bg-white dark:bg-gray-900"
              style={{
                borderRadius: dt.radius.lg,
                boxShadow: dt.shadow.card,
                padding: dt.spacing[5]
              }}
            >
              <label
                className={`block font-medium ${getTextColorClass('primary')}`}
                style={{
                  fontSize: dt.typography.sizes.body,
                  marginBottom: dt.spacing[3]
                }}
              >
                برای کی؟
              </label>
              <div
                className="flex bg-gray-100 dark:bg-gray-800"
                style={{
                  borderRadius: dt.radius.md,
                  padding: dt.spacing[1]
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpenseType('family')}
                  disabled={loading}
                  className="flex-1 font-medium transition-all"
                  style={{
                    fontSize: dt.typography.sizes.body,
                    paddingTop: dt.spacing[2],
                    paddingBottom: dt.spacing[2],
                    paddingLeft: dt.spacing[4],
                    paddingRight: dt.spacing[4],
                    borderRadius: dt.radius.sm,
                    backgroundColor: expenseType === 'family' ? dt.colors.brand.primary : 'transparent',
                    color: expenseType === 'family' ? 'white' : dt.colors.text.secondary
                  }}
                >
                  خانواده
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType('personal')}
                  disabled={loading}
                  className="flex-1 font-medium transition-all"
                  style={{
                    fontSize: dt.typography.sizes.body,
                    paddingTop: dt.spacing[2],
                    paddingBottom: dt.spacing[2],
                    paddingLeft: dt.spacing[4],
                    paddingRight: dt.spacing[4],
                    borderRadius: dt.radius.sm,
                    backgroundColor: expenseType === 'personal' ? dt.colors.brand.primary : 'transparent',
                    color: expenseType === 'personal' ? 'white' : dt.colors.text.secondary
                  }}
                >
                  فقط من
                </button>
              </div>
              {expenseType === 'personal' && (
                <p
                  className={`${getTextColorClass('secondary')}`}
                  style={{
                    fontSize: dt.typography.sizes.caption,
                    marginTop: dt.spacing[2]
                  }}
                >
                  این هزینه فقط به نام شما ثبت می‌شود
                </p>
              )}
            </div>
          </div>

          {/* SECONDARY SECTION - Optional fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[4], paddingTop: dt.spacing[2] }}>
            {/* 4. Category */}
            <div
              className="bg-white dark:bg-gray-900"
              style={{
                borderRadius: dt.radius.lg,
                boxShadow: dt.shadow.card,
                padding: dt.spacing[5]
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: dt.spacing[3] }}
              >
                <label
                  className={`font-medium ${getTextColorClass('primary')}`}
                  style={{ fontSize: dt.typography.sizes.body }}
                >
                  دسته‌بندی
                </label>
                <span
                  className={getTextColorClass('secondary')}
                  style={{ fontSize: dt.typography.sizes.caption }}
                >
                  اختیاری
                </span>
              </div>

              {/* Recent Categories Chips */}
              {recentCategories.length > 0 && (
                <div style={{ marginBottom: dt.spacing[3] }}>
                  <p
                    className={getTextColorClass('secondary')}
                    style={{
                      fontSize: dt.typography.sizes.caption,
                      marginBottom: dt.spacing[2]
                    }}
                  >
                    دسته‌های اخیر
                  </p>
                  <div className="flex flex-wrap" style={{ gap: dt.spacing[2] }}>
                    {recentCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category.id)}
                        disabled={loading}
                        className="flex items-center transition-all border font-medium"
                        style={{
                          fontSize: dt.typography.sizes.caption,
                          gap: dt.spacing[2],
                          paddingLeft: dt.spacing[3],
                          paddingRight: dt.spacing[3],
                          paddingTop: dt.spacing[2],
                          paddingBottom: dt.spacing[2],
                          borderRadius: dt.radius.md,
                          backgroundColor: categoryId === category.id ? dt.colors.brand.primarySoft : 'rgb(249, 250, 251)',
                          borderColor: categoryId === category.id ? dt.colors.brand.primary : 'rgb(229, 231, 235)',
                          color: categoryId === category.id ? dt.colors.brand.primary : dt.colors.text.secondary
                        }}
                      >
                        <span style={{ fontSize: dt.typography.sizes.bodyLarge }}>{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      disabled={loading}
                      className={`flex items-center transition-all border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium ${getTextColorClass('secondary')}`}
                      style={{
                        fontSize: dt.typography.sizes.caption,
                        gap: dt.spacing[1],
                        paddingLeft: dt.spacing[3],
                        paddingRight: dt.spacing[3],
                        paddingTop: dt.spacing[2],
                        paddingBottom: dt.spacing[2],
                        borderRadius: dt.radius.md
                      }}
                    >
                      <FamilyIcon name="add" size={16} />
                      <span>بیشتر</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Category Dropdown */}
              {(showAllCategories || recentCategories.length === 0) && (
                <select
                  value={categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:border-transparent ${getTextColorClass('primary')}`}
                  style={{
                    fontSize: dt.typography.sizes.body,
                    padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
                    borderRadius: dt.radius.md,
                    outlineColor: dt.colors.brand.primary
                  }}
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
            <div
              className="bg-white dark:bg-gray-900"
              style={{
                borderRadius: dt.radius.lg,
                boxShadow: dt.shadow.card,
                padding: dt.spacing[5]
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: dt.spacing[2] }}
              >
                <label
                  className="text-gray-700 dark:text-gray-300 font-medium"
                  style={{ fontSize: dt.typography.sizes.body }}
                >
                  تاریخ
                </label>
                <span
                  className="text-gray-400 dark:text-gray-500"
                  style={{ fontSize: dt.typography.sizes.caption }}
                >
                  اختیاری
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[2] }}>
                <PersianDatePicker
                  value={expenseDate}
                  onChange={setExpenseDate}
                  disabled={loading}
                  placeholder="انتخاب تاریخ"
                />
                <div className="flex" style={{ gap: dt.spacing[2] }}>
                  <button
                    type="button"
                    onClick={setToday}
                    disabled={loading}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors text-gray-700 dark:text-gray-300"
                    style={{
                      padding: `${dt.spacing[2]}px ${dt.spacing[3]}px`,
                      borderRadius: dt.radius.sm,
                      fontSize: dt.typography.sizes.caption
                    }}
                  >
                    امروز
                  </button>
                  <button
                    type="button"
                    onClick={setYesterday}
                    disabled={loading}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors text-gray-700 dark:text-gray-300"
                    style={{
                      padding: `${dt.spacing[2]}px ${dt.spacing[3]}px`,
                      borderRadius: dt.radius.sm,
                      fontSize: dt.typography.sizes.caption
                    }}
                  >
                    دیروز
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Description */}
            <div
              className="bg-white dark:bg-gray-900"
              style={{
                borderRadius: dt.radius.lg,
                boxShadow: dt.shadow.card,
                padding: dt.spacing[5]
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: dt.spacing[2] }}
              >
                <label
                  className="text-gray-700 dark:text-gray-300 font-medium"
                  style={{ fontSize: dt.typography.sizes.body }}
                >
                  توضیحات
                </label>
                <span
                  className="text-gray-400 dark:text-gray-500"
                  style={{ fontSize: dt.typography.sizes.caption }}
                >
                  اختیاری
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="یادداشت کوتاه..."
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:border-transparent resize-none text-gray-900 dark:text-gray-100"
                style={{
                  fontSize: dt.typography.sizes.body,
                  padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
                  borderRadius: dt.radius.md,
                  outlineColor: dt.colors.brand.primary
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className={`bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 ${getTextColorClass('danger')}`}
              style={{
                fontSize: dt.typography.sizes.body,
                padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
                borderRadius: dt.radius.md
              }}
            >
              {error}
            </div>
          )}

          {/* CTA - Simple and calm */}
          <FamilyButton
            type="submit"
            variant="danger"
            size="lg"
            fullWidth
            disabled={loading || !title.trim() || !amount}
            loading={loading}
          >
            {loading ? 'در حال ثبت...' : 'ثبت خرج'}
          </FamilyButton>
        </form>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: dt.spacing[8] * 2 }}></div>
    </div>
  )
}
