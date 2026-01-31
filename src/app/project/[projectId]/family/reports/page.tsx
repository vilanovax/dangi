'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getCurrentPeriodKey,
  getCurrentPersianYear,
  getCurrentPersianMonth,
} from '@/lib/utils/persian-date'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { designTokens as dt } from '@/styles/design-tokens'
import {
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'
import { FamilyIcon } from '../components/FamilyIcon'
import { FamilyButton } from '../components/FamilyButton'

interface MonthReport {
  periodKey: string
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  topExpenses?: Array<{
    categoryName: string
    categoryIcon?: string
    amount: number
    percentage: number
  }>
}

export default function ReportsOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Get current Persian year and month
  const currentYear = getCurrentPersianYear()
  const currentMonth = parseInt(getCurrentPersianMonth())

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<MonthReport | null>(null)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  const monthNames = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ]

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      try {
        const periodKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
        const res = await fetch(
          `/api/projects/${projectId}/family-stats?period=${periodKey}`
        )

        if (res.ok) {
          const data = await res.json()
          // Fix: داده‌ها در data.stats قرار دارند
          const stats = data.stats || {}
          setReport({
            periodKey,
            totalIncome: stats.totalIncome || 0,
            totalExpenses: stats.totalExpenses || 0,
            netSavings: stats.netSavings || 0,
            savingsRate: stats.savingsRate || 0,
            topExpenses: stats.topExpenses || [],
          })
        }
      } catch (err) {
        console.error('Error fetching report:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [projectId, selectedYear, selectedMonth])

  const handleViewDetails = () => {
    const periodKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
    router.push(`/project/${projectId}/family/reports/${periodKey}`)
  }

  // Aggregate categories to prevent duplicates
  const getAggregatedCategories = () => {
    if (!report?.topExpenses || report.topExpenses.length === 0) return []

    // Group by category name and sum percentages/amounts
    const categoryMap = new Map<string, typeof report.topExpenses[0]>()

    report.topExpenses.forEach((category) => {
      const key = category.categoryName || 'بدون دسته‌بندی'

      if (categoryMap.has(key)) {
        const existing = categoryMap.get(key)!
        categoryMap.set(key, {
          ...existing,
          amount: existing.amount + category.amount,
          percentage: existing.percentage + category.percentage,
        })
      } else {
        categoryMap.set(key, { ...category })
      }
    })

    // Convert to array and sort by percentage descending
    return Array.from(categoryMap.values())
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4) // Top 4 only
  }

  // جمع‌بندی هوشمند این ماه - حداکثر 2 نکته
  const getMonthlyInsights = () => {
    if (!report) return []

    const insights: string[] = []
    const aggregatedCategories = getAggregatedCategories()

    // Insight 1: بیشترین دسته
    if (aggregatedCategories.length > 0) {
      insights.push(`بیشترین خرج مربوط به «${aggregatedCategories[0].categoryName}» بوده`)
    }

    // Insight 2: عملکرد پس‌انداز (با ایموجی فقط در مثبت)
    if (report.savingsRate >= 20) {
      insights.push('عملکرد پس‌اندازت عالی بوده 👏')
    } else if (report.savingsRate >= 10) {
      insights.push('عملکرد پس‌اندازت نسبتاً خوب بوده')
    } else if (report.savingsRate >= 0) {
      insights.push('با کمی کنترل هزینه، ماه بعد بهتر می‌شی')
    } else {
      insights.push('این ماه خرج‌ها بیشتر از درآمد بوده')
    }

    return insights.slice(0, 2) // حداکثر 2 نکته
  }

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header - آبی استاندارد برای گزارش */}
      <div
        className={`text-white shadow-lg sticky top-0 z-10 ${getHeaderGradient('info')}`}
        style={{ padding: dt.spacing[5] }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1" style={{ gap: dt.spacing[3] }}>
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full transition-colors"
              style={{ padding: dt.spacing[2] }}
              aria-label="بازگشت"
            >
              <FamilyIcon name="back" size={24} className="text-white" />
            </button>
            <div>
              <h1
                className="font-bold"
                style={{ fontSize: dt.typography.sizes.headline }}
              >
                گزارش‌های مالی
              </h1>
              <p
                className="text-white/80 mt-0.5"
                style={{ fontSize: dt.typography.sizes.caption }}
              >
                عملکرد مالی خانواده
              </p>
            </div>
          </div>

          {/* Month/Year Selector - Compact */}
          <button
            onClick={() => setShowMonthPicker(true)}
            className="flex items-center bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
            style={{
              gap: dt.spacing[2],
              paddingLeft: dt.spacing[4],
              paddingRight: dt.spacing[4],
              paddingTop: dt.spacing[2],
              paddingBottom: dt.spacing[2],
              borderRadius: dt.radius.md
            }}
          >
            <span
              className="font-bold"
              style={{ fontSize: dt.typography.sizes.body }}
            >
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <span style={{ fontSize: dt.typography.sizes.caption }}>▾</span>
          </button>
        </div>
      </div>

      {/* Month Picker Bottom Sheet */}
      <BottomSheet isOpen={showMonthPicker} onClose={() => setShowMonthPicker(false)}>
        <div style={{ paddingTop: dt.spacing[4], paddingBottom: dt.spacing[4] }}>
          <h3
            className={`font-bold text-center ${getTextColorClass('primary')}`}
            style={{
              fontSize: dt.typography.sizes.headline,
              marginBottom: dt.spacing[6]
            }}
          >
            انتخاب دوره گزارش
          </h3>

          <div
            className="grid grid-cols-2"
            style={{
              gap: dt.spacing[4],
              marginBottom: dt.spacing[6]
            }}
          >
            {/* Year selector */}
            <div>
              <label
                className={`block font-medium ${getTextColorClass('primary')}`}
                style={{
                  fontSize: dt.typography.sizes.body,
                  marginBottom: dt.spacing[2]
                }}
              >
                سال
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 text-gray-900 dark:text-gray-100"
                style={{
                  padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
                  borderRadius: dt.radius.md,
                  outlineColor: dt.colors.brand.primary
                }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month selector */}
            <div>
              <label
                className={`block font-medium ${getTextColorClass('primary')}`}
                style={{
                  fontSize: dt.typography.sizes.body,
                  marginBottom: dt.spacing[2]
                }}
              >
                ماه
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 text-gray-900 dark:text-gray-100"
                style={{
                  padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
                  borderRadius: dt.radius.md,
                  outlineColor: dt.colors.brand.primary
                }}
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowMonthPicker(false)}
            className="w-full text-white font-bold hover:shadow-lg transition-all"
            style={{
              paddingTop: dt.spacing[3],
              paddingBottom: dt.spacing[3],
              backgroundColor: dt.colors.semantic.info,
              borderRadius: dt.radius.md
            }}
          >
            تأیید
          </button>
        </div>
      </BottomSheet>

      <div
        className="max-w-2xl mx-auto"
        style={{ padding: dt.spacing[4] }}
      >

        {loading ? (
          <div
            className="text-center"
            style={{ paddingTop: 64, paddingBottom: 64 }}
          >
            <div
              className="inline-block animate-spin rounded-full h-10 w-10 border-4"
              style={{
                borderColor: 'rgba(79, 110, 247, 0.2)',
                borderTopColor: dt.colors.semantic.info
              }}
            ></div>
            <p
              className={getTextColorClass('secondary')}
              style={{ marginTop: dt.spacing[4] }}
            >
              در حال بارگذاری گزارش...
            </p>
          </div>
        ) : !report ? (
          /* Empty State - هنوز گزارشی نیست */
          <div
            className={`text-center shadow-xl ${getCardBackgroundClass()}`}
            style={{
              borderRadius: dt.radius.xl,
              padding: dt.spacing[8] * 1.5
            }}
          >
            <div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
              style={{
                marginBottom: dt.spacing[6],
                backgroundColor: 'rgba(238, 242, 255, 1)'
              }}
            >
              <FamilyIcon name="reports" size={48} style={{ color: dt.colors.semantic.info }} />
            </div>
            <h2
              className={`font-bold ${getTextColorClass('primary')}`}
              style={{
                fontSize: dt.typography.sizes.headline,
                marginBottom: dt.spacing[3]
              }}
            >
              هنوز گزارشی برای این دوره نداریم
            </h2>
            <p
              className={`leading-relaxed ${getTextColorClass('secondary')}`}
              style={{
                fontSize: dt.typography.sizes.body,
                marginBottom: dt.spacing[6]
              }}
            >
              با ثبت اولین تراکنش، گزارش ساخته می‌شه
            </p>
            <FamilyButton
              onClick={() => router.push(`/project/${projectId}/family/add-expense`)}
              variant="danger"
              size="md"
              icon="expense"
            >
              ثبت تراکنش
            </FamilyButton>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[6] }}>
            {/* 1️⃣ Monthly Summary (Hero Card) */}
            <div
              className={`shadow-md ${getCardBackgroundClass()}`}
              style={{
                borderRadius: dt.radius.lg,
                padding: dt.spacing[6]
              }}
            >
              <div
                className={getTextColorClass('secondary')}
                style={{
                  fontSize: dt.typography.sizes.body,
                  marginBottom: dt.spacing[4]
                }}
              >
                وضعیت مالی این ماه
              </div>

              {/* Primary Metric - فقط یک عدد بزرگ */}
              <div style={{ marginBottom: dt.spacing[6] }}>
                <div
                  className="font-black leading-none"
                  style={{
                    fontSize: 48,
                    color: report.netSavings >= 0 ? dt.colors.semantic.income : dt.colors.semantic.expense
                  }}
                >
                  {report.netSavings >= 0 ? '+' : ''}
                  {(report.netSavings / 10).toLocaleString('fa-IR')}
                  <span
                    className="font-medium text-gray-400 dark:text-gray-600"
                    style={{ fontSize: dt.typography.sizes.bodyLarge }}
                  >
                    {' '}تومان
                  </span>
                </div>
                <div
                  className={getTextColorClass('secondary')}
                  style={{
                    fontSize: dt.typography.sizes.caption,
                    marginTop: dt.spacing[2]
                  }}
                >
                  پس‌انداز خالص
                </div>
              </div>

              {/* Secondary Metrics - کوچک و inline */}
              <div
                className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800"
                style={{
                  gap: dt.spacing[4],
                  paddingTop: dt.spacing[4]
                }}
              >
                <div>
                  <div
                    className={getTextColorClass('secondary')}
                    style={{
                      fontSize: 10,
                      marginBottom: dt.spacing[1]
                    }}
                  >
                    درآمد
                  </div>
                  <div
                    className={`font-semibold ${getTextColorClass('primary')}`}
                    style={{ fontSize: dt.typography.sizes.body }}
                  >
                    {(report.totalIncome / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div>
                  <div
                    className={getTextColorClass('secondary')}
                    style={{
                      fontSize: 10,
                      marginBottom: dt.spacing[1]
                    }}
                  >
                    هزینه
                  </div>
                  <div
                    className={`font-semibold ${getTextColorClass('primary')}`}
                    style={{ fontSize: dt.typography.sizes.body }}
                  >
                    {(report.totalExpenses / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div>
                  <div
                    className={getTextColorClass('secondary')}
                    style={{
                      fontSize: 10,
                      marginBottom: dt.spacing[1]
                    }}
                  >
                    نرخ پس‌انداز
                  </div>
                  <div
                    className={`font-semibold ${getTextColorClass('primary')}`}
                    style={{ fontSize: dt.typography.sizes.body }}
                  >
                    {(report.savingsRate ?? 0).toFixed(0)}٪
                  </div>
                </div>
              </div>
            </div>

            {/* 2️⃣ Main Insight Box - جمع‌بندی این ماه */}
            <div
              className="border"
              style={{
                backgroundColor: 'rgba(238, 242, 255, 1)',
                borderRadius: dt.radius.lg,
                padding: dt.spacing[5],
                borderColor: 'rgba(79, 110, 247, 0.2)'
              }}
            >
              <div
                className={`font-semibold ${getTextColorClass('info')}`}
                style={{
                  marginBottom: dt.spacing[3],
                  fontSize: dt.typography.sizes.body
                }}
              >
                جمع‌بندی این ماه
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[2] }}>
                {getMonthlyInsights().map((insight, index) => (
                  <div key={index} className="flex items-start" style={{ gap: dt.spacing[2] }}>
                    <span
                      className={getTextColorClass('info')}
                      style={{
                        fontSize: 10,
                        marginTop: dt.spacing[1]
                      }}
                    >
                      •
                    </span>
                    <div
                      className={`leading-relaxed ${getTextColorClass('info')}`}
                      style={{ fontSize: dt.typography.sizes.body }}
                    >
                      {insight}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3️⃣ Expense Breakdown - بیشترین هزینه‌ها بر اساس دسته */}
            {(() => {
              const aggregatedCategories = getAggregatedCategories()
              return aggregatedCategories.length > 0 && (
                <div
                  className={`shadow-md ${getCardBackgroundClass()}`}
                  style={{
                    borderRadius: dt.radius.lg,
                    padding: dt.spacing[5]
                  }}
                >
                  <div
                    className={`font-semibold ${getTextColorClass('primary')}`}
                    style={{
                      marginBottom: dt.spacing[4],
                      fontSize: dt.typography.sizes.body
                    }}
                  >
                    بیشترین هزینه‌ها بر اساس دسته
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[4] }}>
                    {aggregatedCategories.map((category, index) => (
                      <div key={`${category.categoryName}-${index}`}>
                        <div
                          className="flex items-center justify-between"
                          style={{ marginBottom: dt.spacing[2] }}
                        >
                          <div className="flex items-center flex-1 min-w-0" style={{ gap: dt.spacing[2] }}>
                            {category.categoryIcon ? (
                              <span
                                className="flex-shrink-0"
                                style={{ fontSize: dt.typography.sizes.bodyLarge }}
                              >
                                {category.categoryIcon}
                              </span>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span
                                className={getTextColorClass('primary')}
                                style={{ fontSize: dt.typography.sizes.body }}
                              >
                                {category.categoryName}
                              </span>
                              {(category.categoryName === 'بدون دسته‌بندی' || !category.categoryIcon) && (
                                <span
                                  className={getTextColorClass('secondary')}
                                  style={{
                                    fontSize: 10,
                                    marginRight: 6
                                  }}
                                >
                                  (پیشنهاد می‌شود دسته‌بندی شود)
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`font-bold ${getTextColorClass('primary')}`}
                            style={{ fontSize: dt.typography.sizes.body }}
                          >
                            {category.percentage.toFixed(0)}٪
                          </div>
                        </div>
                        <div
                          className="bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
                          style={{ height: 10 }}
                        >
                          <div
                            className="h-full bg-gradient-to-l transition-all"
                            style={{
                              width: `${Math.min(category.percentage, 100)}%`,
                              backgroundImage: 'linear-gradient(to left, #4F6EF7, #6D83FF)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* نمایش دکمه "مشاهده همه" اگر بیش از 4 دسته وجود دارد */}
                  {report.topExpenses && report.topExpenses.length > 4 && (
                    <button
                      onClick={handleViewDetails}
                      className={`w-full border-t border-gray-100 dark:border-gray-800 font-medium hover:opacity-70 transition-opacity ${getTextColorClass('info')}`}
                      style={{
                        marginTop: dt.spacing[4],
                        paddingTop: dt.spacing[3],
                        fontSize: dt.typography.sizes.body
                      }}
                    >
                      مشاهده همه دسته‌ها
                    </button>
                  )}
                </div>
              )
            })()}

            {/* 4️⃣ Primary Action - گزارش کامل */}
            <button
              onClick={handleViewDetails}
              className="w-full shadow-lg transition-all text-white group active:scale-[0.98]"
              style={{
                backgroundColor: dt.colors.semantic.info,
                borderRadius: dt.radius.lg,
                padding: dt.spacing[5]
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <div
                    className="font-bold mb-1"
                    style={{ fontSize: dt.typography.sizes.bodyLarge }}
                  >
                    مشاهده گزارش کامل این ماه
                  </div>
                  <div
                    className="opacity-90"
                    style={{ fontSize: dt.typography.sizes.body }}
                  >
                    جزئیات هزینه‌ها، درآمدها و بودجه
                  </div>
                </div>
                <FamilyIcon name="back" size={20} className="text-white rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 5️⃣ Quick Actions Grid */}
            <div
              className={`shadow-md ${getCardBackgroundClass()}`}
              style={{
                borderRadius: dt.radius.lg,
                padding: dt.spacing[5]
              }}
            >
              <div
                className={`font-semibold ${getTextColorClass('primary')}`}
                style={{
                  marginBottom: dt.spacing[4],
                  fontSize: dt.typography.sizes.body
                }}
              >
                دسترسی سریع
              </div>
              <div className="grid grid-cols-3" style={{ gap: dt.spacing[3] }}>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/transactions`)
                  }
                  className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all active:scale-95"
                  style={{
                    borderRadius: dt.radius.md,
                    padding: dt.spacing[4]
                  }}
                >
                  <div
                    className="w-8 h-8 mx-auto rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm"
                    style={{ marginBottom: dt.spacing[2] }}
                  >
                    <FamilyIcon name="transactions" size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div
                    className={getTextColorClass('primary')}
                    style={{ fontSize: dt.typography.sizes.caption }}
                  >
                    همه تراکنش‌ها
                  </div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/budgets/set`)
                  }
                  className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all active:scale-95"
                  style={{
                    borderRadius: dt.radius.md,
                    padding: dt.spacing[4]
                  }}
                >
                  <div
                    className="w-8 h-8 mx-auto rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm"
                    style={{ marginBottom: dt.spacing[2] }}
                  >
                    <FamilyIcon name="budget" size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div
                    className={getTextColorClass('primary')}
                    style={{ fontSize: dt.typography.sizes.caption }}
                  >
                    تنظیم بودجه
                  </div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/recurring`)
                  }
                  className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all active:scale-95"
                  style={{
                    borderRadius: dt.radius.md,
                    padding: dt.spacing[4]
                  }}
                >
                  <div
                    className="w-8 h-8 mx-auto rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm"
                    style={{ marginBottom: dt.spacing[2] }}
                  >
                    <FamilyIcon name="recurring" size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div
                    className={getTextColorClass('primary')}
                    style={{ fontSize: dt.typography.sizes.caption }}
                  >
                    تکراری‌ها
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
