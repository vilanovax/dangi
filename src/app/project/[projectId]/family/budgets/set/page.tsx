'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { getCurrentPeriodKey } from '@/lib/utils/persian-date'

interface Category {
  id: string
  name: string
  icon?: string | null
}

interface BudgetInput {
  categoryId: string
  amount: number
}

// دسته‌های مهم که به‌صورت پیش‌فرض نمایش داده می‌شوند
const PRIORITY_CATEGORIES = [
  'خوراک و خواربار',
  'مسکن',
  'حمل‌ونقل',
  'تفریح',
  'قبوض',
]

// راهنمای هر دسته
const CATEGORY_HINTS: Record<string, string> = {
  'خوراک و خواربار': 'معمولاً بیشترین خرج اینجاست',
  'مسکن': 'اجاره، اینترنت، نگهداری',
  'حمل‌ونقل': 'بنزین، تاکسی، اتوبوس',
  'تفریح': 'برای حال خوب لازمه 😊',
  'قبوض': 'برق، گاز، آب و...',
  'سلامت و درمان': 'دارو، پزشک، بیمه',
  'آموزش': 'کتاب، دوره، کلاس',
  'پوشاک': 'لباس، کفش و لوازم شخصی',
}

export default function SetBudgetsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Get current period (Persian/Shamsi calendar)
  const periodKey = getCurrentPeriodKey() // e.g., "1403-10"
  const [year, month] = periodKey.split('-')

  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Record<string, number>>({}) // categoryId -> amount number
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchLoading, setFetchLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  // Fetch categories and existing budgets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, budgetsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/categories`),
          fetch(`/api/projects/${projectId}/budgets?period=${periodKey}`),
        ])

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data.categories || [])
        }

        if (budgetsRes.ok) {
          const data = await budgetsRes.json()
          // Populate existing budgets
          const existingBudgets: Record<string, number> = {}
          data.budgets?.forEach((budget: any) => {
            existingBudgets[budget.categoryId] = budget.amount / 10 // Convert to Toman
          })
          setBudgets(existingBudgets)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('خطا در بارگذاری اطلاعات')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchData()
  }, [projectId, periodKey])

  const handleBudgetChange = (categoryId: string, value: number) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryId]: value,
    }))
  }

  const handleSliderChange = (categoryId: string, value: number) => {
    // Round to nearest 100,000 Toman
    const rounded = Math.round(value / 100000) * 100000
    handleBudgetChange(categoryId, rounded)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Prepare budget data (only non-zero amounts)
    const budgetInputs: BudgetInput[] = []
    Object.entries(budgets).forEach(([categoryId, amount]) => {
      if (amount > 0) {
        budgetInputs.push({ categoryId, amount: amount * 10 }) // Convert to Rial
      }
    })

    if (budgetInputs.length === 0) {
      setError('لطفاً حداقل یک بودجه تنظیم کن')
      return
    }

    setLoading(true)

    try {
      // Save each budget (upsert)
      const promises = budgetInputs.map((input) =>
        fetch(`/api/projects/${projectId}/budgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: input.categoryId,
            amount: input.amount,
            periodKey,
          }),
        })
      )

      const results = await Promise.all(promises)
      const failedRequests = results.filter((res) => !res.ok)

      if (failedRequests.length > 0) {
        throw new Error('برخی از بودجه‌ها ذخیره نشدند')
      }

      // Show success message
      setShowSuccess(true)

      // Navigate back after 1.5 seconds
      setTimeout(() => {
        router.push(`/project/${projectId}/family/budgets`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره بودجه‌ها')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-amber-200 border-t-amber-600"></div>
      </div>
    )
  }

  // Success overlay
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            بودجه این ماه ذخیره شد
          </h2>
          <p className="text-stone-600">
            حالا می‌تونی خرج‌هات رو راحت‌تر کنترل کنی 👌
          </p>
        </div>
      </div>
    )
  }

  // Parse period for display
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ]
  const monthName = monthNames[parseInt(month, 10) - 1]

  // Filter categories into priority and others
  const priorityCategories = categories.filter((cat) =>
    PRIORITY_CATEGORIES.includes(cat.name)
  )
  const otherCategories = categories.filter(
    (cat) => !PRIORITY_CATEGORIES.includes(cat.name)
  )

  const displayedCategories = showAllCategories
    ? categories
    : priorityCategories

  // محاسبه جمع کل بودجه‌ها
  const totalBudgetAmount = Object.values(budgets).reduce((sum, amount) => sum + amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            type="button"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold">تنظیم بودجه</h1>
            <p className="text-white/80 text-xs mt-0.5">
              {monthName} {year}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info card - دوستانه */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h3 className="font-bold text-stone-800 mb-2 text-lg">
                  مشخص کن این ماه حداکثر چقدر می‌خوای خرج کنی
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  نگران نباش، هر وقت خواستی می‌تونی تغییرش بدی 😊
                  بودجه فقط یه راهنماست تا آخر ماه غافلگیر نشی.
                </p>
              </div>
            </div>
          </div>

          {/* Total Budget Summary - جمع کل */}
          {totalBudgetAmount > 0 && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 shadow-lg text-white sticky top-20 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs opacity-90 mb-1">جمع بودجه‌های این ماه</div>
                  <div className="text-3xl font-black">
                    {totalBudgetAmount.toLocaleString('fa-IR')}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">تومان</div>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💰</span>
                </div>
              </div>
            </div>
          )}

          {/* Categories list */}
          <div className="space-y-3">
            {displayedCategories.map((category) => {
              const currentBudget = budgets[category.id] || 0
              const maxBudget = 50000000 // 5M Toman max for slider

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-3">
                    {category.icon && (
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-stone-800">
                        {category.name}
                      </div>
                      {CATEGORY_HINTS[category.name] && (
                        <div className="text-xs text-stone-500 mt-0.5">
                          {CATEGORY_HINTS[category.name]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount display */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-black text-amber-600">
                      {currentBudget.toLocaleString('fa-IR')}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">تومان</div>
                  </div>

                  {/* Slider */}
                  <div className="mb-3">
                    <input
                      type="range"
                      min="0"
                      max={maxBudget}
                      step="100000"
                      value={currentBudget}
                      onChange={(e) =>
                        handleSliderChange(category.id, parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-amber-500
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:hover:bg-amber-600
                        [&::-moz-range-thumb]:w-5
                        [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-amber-500
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:shadow-md
                        [&::-moz-range-thumb]:hover:bg-amber-600"
                      disabled={loading}
                    />
                  </div>

                  {/* Quick amount buttons - کوچکتر و ساده‌تر */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[500000, 1000000, 2000000, 5000000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleBudgetChange(category.id, amount)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-medium transition-colors"
                        disabled={loading}
                      >
                        {(amount / 1000000).toFixed(amount >= 1000000 ? 0 : 1)}M
                      </button>
                    ))}
                    {currentBudget > 0 && (
                      <button
                        type="button"
                        onClick={() => handleBudgetChange(category.id, 0)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-medium transition-colors"
                        disabled={loading}
                      >
                        × پاک
                      </button>
                    )}
                  </div>

                  {/* Manual input */}
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">یا دقیق وارد کن:</span>
                      <input
                        type="number"
                        value={currentBudget || ''}
                        onChange={(e) =>
                          handleBudgetChange(
                            category.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Show more categories button */}
          {!showAllCategories && otherCategories.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="w-full bg-white hover:bg-stone-50 rounded-2xl p-3.5 shadow-sm transition-all text-stone-700 font-medium flex items-center justify-center gap-2 text-sm"
            >
              <span>➕</span>
              <span>افزودن دسته دیگر ({otherCategories.length})</span>
            </button>
          )}

          {categories.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-stone-600">
              هیچ دسته‌بندی‌ای یافت نشد
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <div className="sticky bottom-4">
            <Button
              type="submit"
              disabled={loading || categories.length === 0}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-2xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ذخیره...</span>
                </div>
              ) : (
                '🎯 شروع با این بودجه'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
