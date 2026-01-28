'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { familyTheme } from '@/styles/family-theme'

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
    <div className="min-h-screen" style={{ backgroundColor: familyTheme.colors.background }}>
      {/* Header */}
      <div
        className="text-white p-5 shadow-lg sticky top-0 z-10"
        style={{ background: familyTheme.gradients.primaryHeader }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            →
          </Link>
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: familyTheme.typography.pageTitle.size,
                fontWeight: familyTheme.typography.pageTitle.weight
              }}
            >
              بودجه این ماه
            </h1>
            <p
              className="text-white/80 mt-0.5"
              style={{ fontSize: familyTheme.typography.small.size }}
            >
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
              <div
                className="rounded-3xl p-8 text-center"
                style={{
                  backgroundColor: familyTheme.colors.card,
                  boxShadow: familyTheme.card.shadow,
                  border: `1px solid ${familyTheme.colors.divider}`
                }}
              >
                <div
                  className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: familyTheme.colors.primarySoft }}
                >
                  <span className="text-4xl">🎯</span>
                </div>
                <h2
                  className="font-bold mb-2"
                  style={{
                    fontSize: familyTheme.typography.pageTitle.size,
                    fontWeight: familyTheme.typography.pageTitle.weight,
                    color: familyTheme.colors.textPrimary
                  }}
                >
                  هنوز بودجه‌ای برای این ماه تعیین نکردی
                </h2>
                <p
                  className="mb-6 leading-relaxed"
                  style={{
                    fontSize: familyTheme.typography.body.size,
                    color: familyTheme.colors.textSecondary
                  }}
                >
                  با تنظیم بودجه، خرج‌هات شفاف‌تر می‌شن
                </p>
                <button
                  onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                  className="px-8 text-white rounded-xl hover:shadow-lg transition-all inline-flex items-center gap-2"
                  style={{
                    height: familyTheme.button.height,
                    backgroundColor: familyTheme.colors.primary,
                    fontSize: familyTheme.button.fontSize,
                    fontWeight: familyTheme.button.fontWeight,
                    borderRadius: familyTheme.button.borderRadius
                  }}
                >
                  <span>🎯</span>
                  <span>تنظیم بودجه</span>
                </button>
              </div>
            ) : (
              /* Budget exists - نمایش وضعیت بودجه */
              <div
                className="rounded-3xl p-6"
                style={{
                  backgroundColor: familyTheme.colors.card,
                  boxShadow: familyTheme.card.shadow,
                  border: `1px solid ${familyTheme.colors.divider}`
                }}
              >
                <div className="text-center mb-6">
                  <div
                    className="mb-2"
                    style={{
                      fontSize: familyTheme.typography.body.size,
                      color: familyTheme.colors.textSecondary
                    }}
                  >
                    بودجه کل ماه
                  </div>
                  <div
                    className="font-bold mb-2"
                    style={{
                      fontSize: '48px',
                      fontWeight: familyTheme.typography.heroNumber.weight,
                      color: familyTheme.colors.primary
                    }}
                  >
                    {overallPercentage.toFixed(0)}%
                  </div>
                  <div
                    className="font-medium"
                    style={{
                      fontSize: familyTheme.typography.body.size,
                      color: familyTheme.colors.textSecondary
                    }}
                  >
                    {getBudgetStatusMessage()}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: familyTheme.typography.body.size, color: familyTheme.colors.textSecondary }}>
                      خرج شده
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        fontWeight: familyTheme.typography.cardNumber.weight,
                        color: familyTheme.colors.danger
                      }}
                    >
                      {(totalSpent / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: familyTheme.typography.body.size, color: familyTheme.colors.textSecondary }}>
                      بودجه کل
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        fontWeight: familyTheme.typography.cardNumber.weight,
                        color: familyTheme.colors.success
                      }}
                    >
                      {(totalBudget / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: familyTheme.typography.body.size, color: familyTheme.colors.textSecondary }}>
                      باقی‌مانده
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        fontWeight: familyTheme.typography.cardNumber.weight,
                        color: totalBudget - totalSpent >= 0 ? familyTheme.colors.info : familyTheme.colors.danger
                      }}
                    >
                      {((totalBudget - totalSpent) / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ backgroundColor: familyTheme.colors.divider }}
                >
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
                  <h2
                    className="font-bold"
                    style={{
                      fontSize: familyTheme.typography.subtitle.size,
                      fontWeight: familyTheme.typography.pageTitle.weight,
                      color: familyTheme.colors.textPrimary
                    }}
                  >
                    بودجه دسته‌ها
                  </h2>
                  <button
                    onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                    className="font-medium hover:opacity-80"
                    style={{
                      fontSize: familyTheme.typography.body.size,
                      color: familyTheme.colors.primary
                    }}
                  >
                    ویرایش
                  </button>
                </div>

                {budgets.map((budget) => (
                  <div
                    key={budget.categoryId}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: familyTheme.colors.card,
                      boxShadow: familyTheme.card.shadow
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: familyTheme.colors.primarySoft }}
                      >
                        <span className="text-xl">{budget.categoryIcon || '📦'}</span>
                      </div>
                      <div className="flex-1">
                        <div
                          className="font-medium"
                          style={{
                            fontSize: familyTheme.typography.body.size,
                            color: familyTheme.colors.textPrimary
                          }}
                        >
                          {budget.categoryName}
                        </div>
                        <div
                          className="mt-0.5"
                          style={{
                            fontSize: familyTheme.typography.small.size,
                            color: familyTheme.colors.textSecondary
                          }}
                        >
                          {(budget.spent / 10).toLocaleString('fa-IR')} از{' '}
                          {(budget.limit / 10).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                      <div
                        className={`font-bold ${getProgressTextColor(budget.percentage)}`}
                        style={{
                          fontSize: familyTheme.typography.subtitle.size,
                          fontWeight: familyTheme.typography.cardNumber.weight
                        }}
                      >
                        {budget.percentage.toFixed(0)}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: familyTheme.colors.divider }}
                    >
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
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: familyTheme.colors.infoSoft,
                border: `1px solid ${familyTheme.colors.info}33`
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-base">💡</span>
                <div style={{ fontSize: familyTheme.typography.small.size, color: familyTheme.colors.info }}>
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
