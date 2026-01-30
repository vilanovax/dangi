'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getCurrentPeriodKey,
  getCurrentPersianYear,
  getCurrentPersianMonth,
} from '@/lib/utils/persian-date'
import { BottomSheet } from '@/components/ui/BottomSheet'
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
      <div className={`text-white p-5 shadow-lg sticky top-0 z-10 ${getHeaderGradient('info')}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="بازگشت"
            >
              <FamilyIcon name="back" size={24} className="text-white" />
            </button>
            <div>
              <h1 className="font-bold text-[22px]">
                گزارش‌های مالی
              </h1>
              <p className="text-white/80 mt-0.5 text-xs">
                عملکرد مالی خانواده
              </p>
            </div>
          </div>

          {/* Month/Year Selector - Compact */}
          <button
            onClick={() => setShowMonthPicker(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl transition-colors"
          >
            <span className="font-bold text-sm">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <span className="text-xs">▾</span>
          </button>
        </div>
      </div>

      {/* Month Picker Bottom Sheet */}
      <BottomSheet isOpen={showMonthPicker} onClose={() => setShowMonthPicker(false)}>
        <div className="py-4">
          <h3 className={`text-xl font-bold text-center mb-6 ${getTextColorClass('primary')}`}>
            انتخاب دوره گزارش
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Year selector */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${getTextColorClass('primary')}`}>
                سال
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-gray-100"
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
              <label className={`block text-sm font-medium mb-2 ${getTextColorClass('primary')}`}>
                ماه
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-gray-100"
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
            className="w-full py-3 bg-[#4F6EF7] dark:bg-[#818CF8] text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            تأیید
          </button>
        </div>
      </BottomSheet>

      <div className="p-4 max-w-2xl mx-auto">

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
            <p className={`mt-4 ${getTextColorClass('secondary')}`}>در حال بارگذاری گزارش...</p>
          </div>
        ) : !report ? (
          /* Empty State - هنوز گزارشی نیست */
          <div className={`rounded-3xl p-12 text-center shadow-xl ${getCardBackgroundClass()}`}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#EEF2FF] dark:bg-[#1E1B3A] flex items-center justify-center">
              <FamilyIcon name="reports" size={48} className="text-[#4F6EF7] dark:text-[#818CF8]" />
            </div>
            <h2 className={`text-xl font-bold mb-3 ${getTextColorClass('primary')}`}>
              هنوز گزارشی برای این دوره نداریم
            </h2>
            <p className={`text-sm mb-6 leading-relaxed ${getTextColorClass('secondary')}`}>
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
          <div className="space-y-6">
            {/* 1️⃣ Monthly Summary (Hero Card) */}
            <div className={`rounded-2xl p-6 shadow-md ${getCardBackgroundClass()}`}>
              <div className={`text-sm mb-4 ${getTextColorClass('secondary')}`}>
                وضعیت مالی این ماه
              </div>

              {/* Primary Metric - فقط یک عدد بزرگ */}
              <div className="mb-6">
                <div className={`text-[48px] font-black leading-none ${report.netSavings >= 0 ? 'text-[#22C55E] dark:text-[#4ADE80]' : 'text-[#EF4444] dark:text-[#F87171]'}`}>
                  {report.netSavings >= 0 ? '+' : ''}
                  {(report.netSavings / 10).toLocaleString('fa-IR')}
                  <span className="text-[16px] font-medium text-gray-400 dark:text-gray-600"> تومان</span>
                </div>
                <div className={`text-xs mt-2 ${getTextColorClass('secondary')}`}>
                  پس‌انداز خالص
                </div>
              </div>

              {/* Secondary Metrics - کوچک و inline */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <div className={`text-[10px] mb-1 ${getTextColorClass('secondary')}`}>درآمد</div>
                  <div className={`text-sm font-semibold ${getTextColorClass('primary')}`}>
                    {(report.totalIncome / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] mb-1 ${getTextColorClass('secondary')}`}>هزینه</div>
                  <div className={`text-sm font-semibold ${getTextColorClass('primary')}`}>
                    {(report.totalExpenses / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] mb-1 ${getTextColorClass('secondary')}`}>نرخ پس‌انداز</div>
                  <div className={`text-sm font-semibold ${getTextColorClass('primary')}`}>
                    {(report.savingsRate ?? 0).toFixed(0)}٪
                  </div>
                </div>
              </div>
            </div>

            {/* 2️⃣ Main Insight Box - جمع‌بندی این ماه */}
            <div className="bg-[#EEF2FF] dark:bg-[#1E1B3A] rounded-2xl p-5 border border-blue-100 dark:border-blue-900">
              <div className={`font-semibold mb-3 text-sm ${getTextColorClass('info')}`}>
                جمع‌بندی این ماه
              </div>
              <div className="space-y-2">
                {getMonthlyInsights().map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className={`text-[10px] mt-1 ${getTextColorClass('info')}`}>•</span>
                    <div className={`text-sm leading-relaxed ${getTextColorClass('info')}`}>
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
                <div className={`rounded-2xl p-5 shadow-md ${getCardBackgroundClass()}`}>
                  <div className={`font-semibold mb-4 text-sm ${getTextColorClass('primary')}`}>
                    بیشترین هزینه‌ها بر اساس دسته
                  </div>
                  <div className="space-y-4">
                    {aggregatedCategories.map((category, index) => (
                      <div key={`${category.categoryName}-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {category.categoryIcon ? (
                              <span className="text-base flex-shrink-0">{category.categoryIcon}</span>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm ${getTextColorClass('primary')}`}>
                                {category.categoryName}
                              </span>
                              {(category.categoryName === 'بدون دسته‌بندی' || !category.categoryIcon) && (
                                <span className={`text-[10px] mr-1.5 ${getTextColorClass('secondary')}`}>
                                  (پیشنهاد می‌شود دسته‌بندی شود)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`text-sm font-bold ${getTextColorClass('primary')}`}>
                            {category.percentage.toFixed(0)}٪
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-l from-[#4F6EF7] to-[#6D83FF] dark:from-[#818CF8] dark:to-[#A5B4FC] transition-all"
                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* نمایش دکمه "مشاهده همه" اگر بیش از 4 دسته وجود دارد */}
                  {report.topExpenses && report.topExpenses.length > 4 && (
                    <button
                      onClick={handleViewDetails}
                      className={`w-full mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm font-medium hover:opacity-70 transition-opacity ${getTextColorClass('info')}`}
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
              className="w-full bg-[#4F6EF7] dark:bg-[#818CF8] hover:bg-[#6D83FF] dark:hover:bg-[#6D83FF] rounded-2xl p-5 shadow-lg transition-all text-white group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <div className="font-bold text-base mb-1">
                    مشاهده گزارش کامل این ماه
                  </div>
                  <div className="text-sm opacity-90">
                    جزئیات هزینه‌ها، درآمدها و بودجه
                  </div>
                </div>
                <FamilyIcon name="back" size={20} className="text-white rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 5️⃣ Quick Actions Grid */}
            <div className={`rounded-2xl p-5 shadow-md ${getCardBackgroundClass()}`}>
              <div className={`font-semibold mb-4 text-sm ${getTextColorClass('primary')}`}>
                دسترسی سریع
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/transactions`)
                  }
                  className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-4 text-sm transition-all active:scale-95"
                >
                  <div className="w-8 h-8 mb-2 mx-auto rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                    <FamilyIcon name="transactions" size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className={`text-xs ${getTextColorClass('primary')}`}>همه تراکنش‌ها</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/budgets/set`)
                  }
                  className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-4 text-sm transition-all active:scale-95"
                >
                  <div className="w-8 h-8 mb-2 mx-auto rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                    <FamilyIcon name="budget" size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className={`text-xs ${getTextColorClass('primary')}`}>تنظیم بودجه</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/recurring`)
                  }
                  className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-4 text-sm transition-all active:scale-95"
                >
                  <div className="w-8 h-8 mb-2 mx-auto rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                    <FamilyIcon name="recurring" size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className={`text-xs ${getTextColorClass('primary')}`}>تکراری‌ها</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
