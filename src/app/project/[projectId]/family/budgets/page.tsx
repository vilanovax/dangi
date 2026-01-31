'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { designTokens as dt } from '@/styles/design-tokens'
import {
  familyTheme,
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'
import { FamilyIcon } from '../components/FamilyIcon'
import { FamilyButton } from '../components/FamilyButton'

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

      // Fix: داده‌ها در data.stats قرار دارند
      const stats = data.stats || {}
      setBudgets(stats.budgets || [])
      setTotalBudget(stats.totalBudget || 0)
      setTotalSpent(stats.totalSpent || 0)
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
      <div
        className={`text-white shadow-lg sticky top-0 z-10 ${getHeaderGradient('primary')}`}
        style={{ padding: dt.spacing[5] }}
      >
        <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full transition-colors"
            style={{ padding: dt.spacing[2] }}
            aria-label="بازگشت"
          >
            <FamilyIcon name="back" size={24} className="text-white" />
          </Link>
          <div>
            <h1
              className="font-bold"
              style={{ fontSize: dt.typography.sizes.headline }}
            >
              بودجه این ماه
            </h1>
            <p
              className="text-white/80 mt-0.5"
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              کنترل و مدیریت خرج‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: dt.spacing[4],
          display: 'flex',
          flexDirection: 'column',
          gap: dt.spacing[4]
        }}
      >
        {loading ? (
          <div className="text-center" style={{ paddingTop: 48, paddingBottom: 48 }}>
            <div
              className="inline-block animate-spin rounded-full h-8 w-8 border-4"
              style={{
                borderColor: dt.colors.brand.primarySoft,
                borderTopColor: dt.colors.brand.primary
              }}
            ></div>
            <p
              className={getTextColorClass('secondary')}
              style={{
                marginTop: dt.spacing[4],
                fontSize: dt.typography.sizes.body
              }}
            >
              در حال بارگذاری...
            </p>
          </div>
        ) : (
          <>
            {/* Overall Budget Card */}
            {!hasBudget ? (
              /* Empty state - بودجه تنظیم نشده */
              <div
                className={`text-center shadow-lg border border-gray-200 dark:border-gray-700 ${getCardBackgroundClass()}`}
                style={{
                  borderRadius: dt.radius.xl,
                  padding: dt.spacing[8]
                }}
              >
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                  style={{
                    marginBottom: dt.spacing[4],
                    backgroundColor: dt.colors.brand.primarySoft
                  }}
                >
                  <FamilyIcon name="budget" size={36} style={{ color: dt.colors.brand.primary }} />
                </div>
                <h2
                  className={`font-bold ${getTextColorClass('primary')}`}
                  style={{
                    fontSize: dt.typography.sizes.headline,
                    marginBottom: dt.spacing[2]
                  }}
                >
                  هنوز بودجه‌ای برای این ماه تعیین نکردی
                </h2>
                <p
                  className={`leading-relaxed ${getTextColorClass('secondary')}`}
                  style={{
                    marginBottom: dt.spacing[6],
                    fontSize: dt.typography.sizes.body
                  }}
                >
                  با تنظیم بودجه، خرج‌هات شفاف‌تر می‌شن
                </p>
                <FamilyButton
                  onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                  variant="primary"
                  size="lg"
                  icon="budget"
                >
                  تنظیم بودجه
                </FamilyButton>
              </div>
            ) : (
              /* Budget exists - نمایش وضعیت بودجه */
              <div
                className={`shadow-lg border border-gray-200 dark:border-gray-700 ${getCardBackgroundClass()}`}
                style={{
                  borderRadius: dt.radius.xl,
                  padding: dt.spacing[6]
                }}
              >
                <div
                  className="text-center"
                  style={{ marginBottom: dt.spacing[6] }}
                >
                  <div
                    className={getTextColorClass('secondary')}
                    style={{
                      marginBottom: dt.spacing[2],
                      fontSize: dt.typography.sizes.body
                    }}
                  >
                    بودجه کل ماه
                  </div>
                  <div
                    className="font-extrabold"
                    style={{
                      fontSize: 48,
                      marginBottom: dt.spacing[2],
                      color: dt.colors.brand.primary
                    }}
                  >
                    {overallPercentage.toFixed(0)}%
                  </div>
                  <div
                    className={`font-medium ${getTextColorClass('secondary')}`}
                    style={{ fontSize: dt.typography.sizes.body }}
                  >
                    {getBudgetStatusMessage()}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: dt.spacing[3],
                    marginBottom: dt.spacing[4]
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={getTextColorClass('secondary')}
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      خرج شده
                    </span>
                    <span
                      className={`font-bold ${getTextColorClass('danger')}`}
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      {(totalSpent / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={getTextColorClass('secondary')}
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      بودجه کل
                    </span>
                    <span
                      className={`font-bold ${getTextColorClass('success')}`}
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      {(totalBudget / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={getTextColorClass('secondary')}
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      باقی‌مانده
                    </span>
                    <span
                      className={`font-bold ${totalBudget - totalSpent >= 0 ? getTextColorClass('info') : getTextColorClass('danger')}`}
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      {((totalBudget - totalSpent) / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div
                  className="rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                  style={{ height: 12 }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: dt.spacing[2] }}
                >
                  <h2
                    className={`font-bold ${getTextColorClass('primary')}`}
                    style={{ fontSize: dt.typography.sizes.bodyLarge }}
                  >
                    بودجه دسته‌ها
                  </h2>
                  <button
                    onClick={() => router.push(`/project/${projectId}/family/budgets/set`)}
                    className="font-medium hover:opacity-80"
                    style={{
                      fontSize: dt.typography.sizes.body,
                      color: dt.colors.brand.primary
                    }}
                  >
                    ویرایش
                  </button>
                </div>

                {budgets.map((budget) => (
                  <div
                    key={budget.categoryId}
                    className={`shadow-sm ${getCardBackgroundClass()}`}
                    style={{
                      borderRadius: dt.radius.lg,
                      padding: dt.spacing[4]
                    }}
                  >
                    <div
                      className="flex items-center"
                      style={{
                        gap: dt.spacing[3],
                        marginBottom: dt.spacing[3]
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: dt.colors.brand.primarySoft }}
                      >
                        {budget.categoryIcon ? (
                          <span style={{ fontSize: dt.typography.sizes.title }}>{budget.categoryIcon}</span>
                        ) : (
                          <FamilyIcon name="categories" size={20} style={{ color: dt.colors.brand.primary }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-medium ${getTextColorClass('primary')}`}
                          style={{ fontSize: dt.typography.sizes.body }}
                        >
                          {budget.categoryName}
                        </div>
                        <div
                          className={`mt-0.5 ${getTextColorClass('secondary')}`}
                          style={{ fontSize: dt.typography.sizes.caption }}
                        >
                          {(budget.spent / 10).toLocaleString('fa-IR')} از{' '}
                          {(budget.limit / 10).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                      <div
                        className={`font-bold ${getProgressTextColor(budget.percentage)}`}
                        style={{ fontSize: dt.typography.sizes.bodyLarge }}
                      >
                        {budget.percentage.toFixed(0)}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                      style={{ height: 8 }}
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
              className="border"
              style={{
                borderRadius: dt.radius.lg,
                padding: dt.spacing[4],
                backgroundColor: 'rgba(238, 242, 255, 1)',
                borderColor: 'rgba(79, 110, 247, 0.2)'
              }}
            >
              <div className="flex items-start" style={{ gap: dt.spacing[2] }}>
                <FamilyIcon
                  name="tip"
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: dt.colors.semantic.info }}
                />
                <div
                  className={getTextColorClass('info')}
                  style={{ fontSize: dt.typography.sizes.caption }}
                >
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
