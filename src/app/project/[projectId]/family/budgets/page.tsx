'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface BudgetItem {
  categoryId: string
  categoryName: string
  categoryIcon?: string
  spent: number
  limit: number
  percentage: number
}

export default function BudgetsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudgets()
  }, [projectId])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/family-stats`)
      const data = await res.json()

      setBudgets(data.budgets || [])
      setTotalBudget(data.totalBudget || 0)
      setTotalSpent(data.totalSpent || 0)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-orange-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-700'
    if (percentage >= 80) return 'text-orange-700'
    if (percentage >= 60) return 'text-yellow-700'
    return 'text-green-700'
  }

  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const hasBudget = totalBudget > 0

  // متن هوشمند برای درصد بودجه
  const getBudgetStatusMessage = () => {
    if (overallPercentage === 0) return 'هنوز از بودجه استفاده نشده'
    if (overallPercentage <= 50) return 'اوضاع خوبه 👍'
    if (overallPercentage <= 80) return 'نیمه راه بودجه رو رد کردی'
    if (overallPercentage <= 100) return 'نزدیک سقف بودجه‌ای ⚠️'
    return 'بودجه این ماه رد شده ⛔'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            →
          </Link>
          <div>
            <h1 className="text-xl font-bold">بودجه این ماه</h1>
            <p className="text-white/80 text-xs mt-0.5">
              کنترل و مدیریت خرج‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="text-stone-600 mt-4">در حال بارگذاری...</p>
          </div>
        ) : (
          <>
            {/* Overall Budget Card */}
            {!hasBudget ? (
              /* Empty state - بودجه تنظیم نشده */
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-amber-100 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <span className="text-4xl">🎯</span>
                </div>
                <h2 className="text-xl font-bold text-stone-800 mb-2">
                  هنوز بودجه‌ای برای این ماه تعیین نکردی
                </h2>
                <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                  با تنظیم بودجه، خرج‌هات شفاف‌تر می‌شن
                </p>
                <button
                  onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <span>🎯</span>
                  <span>تنظیم بودجه</span>
                </button>
              </div>
            ) : (
              /* Budget exists - نمایش وضعیت بودجه */
              <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-amber-100">
                <div className="text-center mb-6">
                  <div className="text-sm text-stone-500 mb-2">بودجه کل ماه</div>
                  <div className="text-5xl font-bold text-amber-600 mb-2">
                    {overallPercentage.toFixed(0)}%
                  </div>
                  <div className="text-sm text-stone-600 font-medium">
                    {getBudgetStatusMessage()}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">خرج شده</span>
                    <span className="font-bold text-red-600">
                      {(totalSpent / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">بودجه کل</span>
                    <span className="font-bold text-green-600">
                      {(totalBudget / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">باقی‌مانده</span>
                    <span className={`font-bold ${totalBudget - totalSpent >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {((totalBudget - totalSpent) / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColor(overallPercentage)}`}
                    style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Budget Items - فقط وقتی بودجه وجود دارد */}
            {hasBudget && budgets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-stone-800">بودجه دسته‌ها</h2>
                  <button
                    onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    ویرایش
                  </button>
                </div>

                {budgets.map((budget) => (
                  <div
                    key={budget.categoryId}
                    className="bg-white rounded-xl p-4 shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-xl">{budget.categoryIcon || '📦'}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-stone-800">
                          {budget.categoryName}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {(budget.spent / 10).toLocaleString('fa-IR')} از{' '}
                          {(budget.limit / 10).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${getProgressTextColor(budget.percentage)}`}>
                        {budget.percentage.toFixed(0)}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getProgressColor(budget.percentage)}`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-base">💡</span>
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">نکته:</p>
                  <p>
                    بودجه‌بندی به شما کمک می‌کند مخارج ماهانه را کنترل کنید و از هزینه‌های
                    اضافی جلوگیری نمایید. تنظیم بودجه برای هر دسته‌بندی اختیاری است.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
