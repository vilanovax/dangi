'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  familyTheme,
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'

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
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header */}
      <div className={`text-white p-5 shadow-lg sticky top-0 z-10 ${getHeaderGradient('primary')}`}>
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            →
          </Link>
          <div>
            <h1 className="text-[22px] font-bold">
              بودجه این ماه
            </h1>
            <p className="text-white/80 mt-0.5 text-xs">
              کنترل و مدیریت خرج‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-200 dark:border-amber-900 border-t-amber-600 dark:border-t-amber-400"></div>
            <p className={`mt-4 text-sm ${getTextColorClass('secondary')}`}>در حال بارگذاری...</p>
          </div>
        ) : (
          <>
            {/* Overall Budget Card */}
            {!hasBudget ? (
              /* Empty state - بودجه تنظیم نشده */
              <div className={`rounded-3xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700 ${getCardBackgroundClass()}`}>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#FFF3E0] dark:bg-[#2D1F0D]">
                  <span className="text-4xl">🎯</span>
                </div>
                <h2 className={`text-[22px] font-bold mb-2 ${getTextColorClass('primary')}`}>
                  هنوز بودجه‌ای برای این ماه تعیین نکردی
                </h2>
                <p className={`mb-6 leading-relaxed text-sm ${getTextColorClass('secondary')}`}>
                  با تنظیم بودجه، خرج‌هات شفاف‌تر می‌شن
                </p>
                <button
                  onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                  className="px-8 text-white rounded-2xl hover:shadow-lg transition-all inline-flex items-center gap-2 h-[52px] bg-[#FF8A00] dark:bg-[#FFA94D] text-[15px] font-bold"
                >
                  <span>🎯</span>
                  <span>تنظیم بودجه</span>
                </button>
              </div>
            ) : (
              /* Budget exists - نمایش وضعیت بودجه */
              <div className={`rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${getCardBackgroundClass()}`}>
                <div className="text-center mb-6">
                  <div className={`mb-2 text-sm ${getTextColorClass('secondary')}`}>
                    بودجه کل ماه
                  </div>
                  <div className="text-[48px] font-extrabold mb-2 text-[#FF8A00] dark:text-[#FFA94D]">
                    {overallPercentage.toFixed(0)}%
                  </div>
                  <div className={`font-medium text-sm ${getTextColorClass('secondary')}`}>
                    {getBudgetStatusMessage()}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${getTextColorClass('secondary')}`}>
                      خرج شده
                    </span>
                    <span className={`text-sm font-bold ${getTextColorClass('danger')}`}>
                      {(totalSpent / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${getTextColorClass('secondary')}`}>
                      بودجه کل
                    </span>
                    <span className={`text-sm font-bold ${getTextColorClass('success')}`}>
                      {(totalBudget / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${getTextColorClass('secondary')}`}>
                      باقی‌مانده
                    </span>
                    <span className={`text-sm font-bold ${totalBudget - totalSpent >= 0 ? getTextColorClass('info') : getTextColorClass('danger')}`}>
                      {((totalBudget - totalSpent) / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
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
                  <h2 className={`text-[15px] font-bold ${getTextColorClass('primary')}`}>
                    بودجه دسته‌ها
                  </h2>
                  <button
                    onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                    className="text-sm font-medium hover:opacity-80 text-[#FF8A00] dark:text-[#FFA94D]"
                  >
                    ویرایش
                  </button>
                </div>

                {budgets.map((budget) => (
                  <div
                    key={budget.categoryId}
                    className={`rounded-2xl p-4 shadow-sm ${getCardBackgroundClass()}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFF3E0] dark:bg-[#2D1F0D]">
                        <span className="text-xl">{budget.categoryIcon || '📦'}</span>
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${getTextColorClass('primary')}`}>
                          {budget.categoryName}
                        </div>
                        <div className={`mt-0.5 text-xs ${getTextColorClass('secondary')}`}>
                          {(budget.spent / 10).toLocaleString('fa-IR')} از{' '}
                          {(budget.limit / 10).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                      <div className={`text-[15px] font-bold ${getProgressTextColor(budget.percentage)}`}>
                        {budget.percentage.toFixed(0)}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
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
            <div className="rounded-2xl p-4 bg-[#EEF2FF] dark:bg-[#1E1B3A] border border-[#4F6EF7]/20 dark:border-[#818CF8]/20">
              <div className="flex items-start gap-2">
                <span className="text-base">💡</span>
                <div className={`text-xs ${getTextColorClass('info')}`}>
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
