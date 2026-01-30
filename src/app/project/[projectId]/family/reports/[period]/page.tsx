'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { FamilyDashboardStats } from '@/types/family'
import {
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'
import { FamilyIcon } from '../../components/FamilyIcon'
import { FamilyButton } from '../../components/FamilyButton'

export default function PeriodDetailReportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const period = params.period as string

  const [stats, setStats] = useState<FamilyDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExportSuccess, setShowExportSuccess] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/projects/${projectId}/family-stats?period=${period}`
        )

        if (!res.ok) throw new Error('خطا در دریافت گزارش')

        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [projectId, period])

  const handleExportCSV = () => {
    if (!stats) return

    // Prepare CSV data
    const rows: string[][] = []

    // Header
    rows.push(['گزارش مالی خانواده', ''])
    rows.push(['دوره', period])
    rows.push(['', ''])

    // Summary
    rows.push(['خلاصه مالی', ''])
    rows.push(['کل درآمد', String(stats.totalIncome)])
    rows.push(['کل هزینه', String(stats.totalExpenses)])
    rows.push(['خالص پس‌انداز', String(stats.netSavings)])
    rows.push(['نرخ پس‌انداز (%)', String(stats.savingsRate)])
    rows.push(['', ''])

    // Budget overview
    rows.push(['وضعیت بودجه', ''])
    rows.push(['کل بودجه', String(stats.totalBudget)])
    rows.push(['مصرف شده', String(stats.totalSpent)])
    rows.push(['درصد استفاده (%)', String(stats.budgetUtilization)])
    rows.push(['', ''])

    // Budget details
    rows.push(['جزئیات بودجه', 'دسته‌بندی', 'بودجه', 'مصرف شده', 'باقیمانده', 'درصد'])
    stats.budgets.forEach((budget) => {
      rows.push([
        '',
        budget.categoryName,
        String(budget.budgetAmount),
        String(budget.spent),
        String(budget.remaining),
        String(budget.percentage),
      ])
    })
    rows.push(['', ''])

    // Top expenses
    rows.push(['بیشترین هزینه‌ها', 'دسته‌بندی', 'مبلغ', 'درصد'])
    stats.topExpenses.forEach((expense) => {
      rows.push([
        '',
        expense.categoryName,
        String(expense.amount),
        String(expense.percentage),
      ])
    })

    // Convert to CSV string
    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    // Add BOM for UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    // Download
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `family-report-${period}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show success feedback
    setShowExportSuccess(true)
    setTimeout(() => setShowExportSuccess(false), 3000)
  }

  // Aggregate categories to prevent duplicates
  const getAggregatedCategories = () => {
    if (!stats?.topExpenses || stats.topExpenses.length === 0) return []

    const categoryMap = new Map<string, typeof stats.topExpenses[0]>()

    stats.topExpenses.forEach((category) => {
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

    return Array.from(categoryMap.values()).sort((a, b) => b.percentage - a.percentage)
  }

  // Combine and sort all transactions chronologically
  const getAllTransactions = () => {
    if (!stats) return []

    const incomes = stats.recentIncomes.map((item) => ({
      ...item,
      type: 'income' as const,
      date: new Date(item.createdAt || Date.now()),
    }))

    const expenses = stats.recentExpenses.map((item) => ({
      ...item,
      type: 'expense' as const,
      date: new Date(item.createdAt || Date.now()),
    }))

    return [...incomes, ...expenses].sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  // Smart insights (max 3)
  const getSmartInsights = () => {
    if (!stats) return []

    const insights: string[] = []
    const aggregated = getAggregatedCategories()

    // Insight 1: Top expense category
    if (aggregated.length > 0) {
      insights.push(
        `بیشترین هزینه مربوط به «${aggregated[0].categoryName}» بوده (${aggregated[0].percentage.toFixed(0)}%)`
      )
    }

    // Insight 2: Budget status
    if (stats.totalBudget > 0) {
      const util = stats.budgetUtilization
      if (util >= 100) {
        insights.push('بودجه این ماه رد شده، ماه بعد دقت بیشتری لازمه')
      } else if (util >= 90) {
        insights.push('تقریباً تمام بودجه مصرف شده، مراقب باش')
      } else if (util < 70) {
        insights.push('بودجه به‌خوبی مدیریت شده')
      }
    }

    // Insight 3: Savings performance
    if (stats.savingsRate >= 20) {
      insights.push('عملکرد پس‌اندازت عالی بوده 👏')
    } else if (stats.netSavings < 0) {
      insights.push('این ماه بیشتر از درآمد خرج کردی')
    }

    return insights.slice(0, 3)
  }

  // Category expand state
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getBackgroundClass()}`}>
        <div className={getTextColorClass('secondary')}>در حال بارگذاری...</div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`min-h-screen p-6 ${getBackgroundClass()}`}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#FEECEC] dark:bg-[#2D1212] border border-[#EF4444]/20 dark:border-[#F87171]/20 text-[#EF4444] dark:text-[#F87171] px-4 py-3 rounded-xl">
            {error || 'خطا در بارگذاری گزارش'}
          </div>
        </div>
      </div>
    )
  }

  // Parse period for display
  const [year, month] = period.split('-')
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
  const monthName = monthNames[parseInt(month, 10) - 1]

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header با گرادیان آبی استاندارد */}
      <div className={`text-white p-6 shadow-lg sticky top-0 z-10 ${getHeaderGradient('info')}`}>
        {/* Breadcrumb - Subtle */}
        <div className="flex items-center gap-1.5 mb-3 text-[11px] opacity-75">
          <span>خانه</span>
          <FamilyIcon name="back" size={10} className="text-white rotate-180" />
          <span>گزارش‌ها</span>
          <FamilyIcon name="back" size={10} className="text-white rotate-180" />
          <span className="opacity-100 font-medium">{monthName} {year}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="بازگشت"
            >
              <FamilyIcon name="back" size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-[20px] font-bold">گزارش کامل {monthName}</h1>
              <p className="text-white/80 text-[12px] mt-0.5">
                تحلیل عمیق و جزئیات مالی
              </p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-white text-[#4F6EF7] dark:text-[#818CF8] px-4 py-2 rounded-full font-medium hover:bg-white/90 dark:hover:bg-white/80 transition-colors text-[13px] flex items-center gap-2"
          >
            <FamilyIcon name="backup" size={16} className="text-[#4F6EF7] dark:text-[#818CF8]" />
            CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Export Success Toast */}
        {showExportSuccess && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
            <div className="flex items-center gap-2">
              <FamilyIcon name="success" size={20} className="text-white" />
              <span className="font-medium">فایل CSV دانلود شد</span>
            </div>
          </div>
        )}

        {/* Section 2: Financial Summary - Compact */}
        <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
          <h2 className={`text-sm font-bold mb-4 ${getTextColorClass('secondary')}`}>
            خلاصه مالی
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Net Savings */}
            <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <div className={`text-xs mb-1 ${getTextColorClass('secondary')}`}>
                خالص پس‌انداز
              </div>
              <div
                className={`text-3xl font-black ${
                  stats.netSavings >= 0
                    ? getTextColorClass('success')
                    : getTextColorClass('danger')
                }`}
              >
                {stats.netSavings >= 0 ? '+' : ''}
                {(stats.netSavings / 10).toLocaleString('fa-IR')}
                <span className="text-xs font-medium text-gray-400 dark:text-gray-600">
                  {' '}
                  تومان
                </span>
              </div>
              <div className={`text-xs mt-1 ${getTextColorClass('secondary')}`}>
                نرخ پس‌انداز: {stats.savingsRate.toFixed(1)}%
              </div>
            </div>

            {/* Total Income */}
            <div className="bg-[#EAFBF1] dark:bg-[#0F2417] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FamilyIcon
                  name="income"
                  size={16}
                  className="text-[#22C55E] dark:text-[#4ADE80]"
                />
                <span className={`text-xs ${getTextColorClass('secondary')}`}>
                  کل درآمد
                </span>
              </div>
              <div className="text-lg font-bold text-[#22C55E] dark:text-[#4ADE80]">
                {(stats.totalIncome / 10).toLocaleString('fa-IR')}
                <span className="text-xs font-medium text-gray-400 dark:text-gray-600">
                  {' '}
                  تومان
                </span>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-[#FEECEC] dark:bg-[#2D1212] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FamilyIcon
                  name="expense"
                  size={16}
                  className="text-[#EF4444] dark:text-[#F87171]"
                />
                <span className={`text-xs ${getTextColorClass('secondary')}`}>
                  کل هزینه
                </span>
              </div>
              <div className="text-lg font-bold text-[#EF4444] dark:text-[#F87171]">
                {(stats.totalExpenses / 10).toLocaleString('fa-IR')}
                <span className="text-xs font-medium text-gray-400 dark:text-gray-600">
                  {' '}
                  تومان
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Expense Distribution Chart */}
        {getAggregatedCategories().length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <h2 className={`text-sm font-bold mb-4 ${getTextColorClass('secondary')}`}>
              توزیع هزینه‌ها
            </h2>
            <div className="space-y-3">
              {getAggregatedCategories().map((category, index) => {
                const barColor =
                  index === 0
                    ? 'bg-[#EF4444] dark:bg-[#F87171]'
                    : index === 1
                      ? 'bg-[#FF8A00] dark:bg-[#FFA94D]'
                      : index === 2
                        ? 'bg-[#F59E0B] dark:bg-[#FBBF24]'
                        : 'bg-[#6B7280] dark:bg-[#9CA3AF]'

                return (
                  <div key={category.categoryName}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {category.categoryIcon && (
                          <span className="text-sm">{category.categoryIcon}</span>
                        )}
                        <span className={`text-sm font-medium ${getTextColorClass('primary')}`}>
                          {category.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs ${getTextColorClass('secondary')}`}>
                          {(category.amount / 10).toLocaleString('fa-IR')} تومان
                        </span>
                        <span className={`text-sm font-bold ${getTextColorClass('primary')}`}>
                          {category.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section 5: Budget Status */}
        {stats.totalBudget > 0 && stats.budgets.filter((b) => b.spent > 0 || b.budgetAmount > 0).length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-bold ${getTextColorClass('secondary')}`}>
                وضعیت بودجه
              </h2>
              <div
                className={`text-lg font-bold ${
                  stats.budgetUtilization >= 100
                    ? getTextColorClass('danger')
                    : stats.budgetUtilization >= 90
                      ? getTextColorClass('warning')
                      : getTextColorClass('info')
                }`}
              >
                {stats.budgetUtilization.toFixed(0)}%
              </div>
            </div>

            <div className="space-y-3">
              {stats.budgets
                .filter((b) => b.spent > 0 || b.budgetAmount > 0)
                .map((budget, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {budget.categoryIcon && <span className="text-sm">{budget.categoryIcon}</span>}
                        <span className={`text-sm font-medium ${getTextColorClass('primary')}`}>
                          {budget.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${getTextColorClass('secondary')}`}>
                          {(budget.spent / 10).toLocaleString('fa-IR')} /{' '}
                          {(budget.budgetAmount / 10).toLocaleString('fa-IR')}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            budget.isOverBudget
                              ? 'text-[#EF4444] dark:text-[#F87171]'
                              : getTextColorClass('secondary')
                          }`}
                        >
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          budget.isOverBudget
                            ? 'bg-[#EF4444] dark:bg-[#F87171]'
                            : budget.percentage >= 90
                              ? 'bg-[#FF8A00] dark:bg-[#FFA94D]'
                              : budget.percentage >= 70
                                ? 'bg-yellow-500 dark:bg-yellow-400'
                                : 'bg-[#22C55E] dark:bg-[#4ADE80]'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Section 4: Category Drill-Down List */}
        {getAggregatedCategories().length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <h2 className={`text-sm font-bold mb-4 ${getTextColorClass('secondary')}`}>
              دسته‌بندی‌های هزینه
            </h2>
            <div className="space-y-2">
              {getAggregatedCategories().map((category, index) => {
                const isExpanded = expandedCategory === category.categoryName
                const relatedExpenses = stats.recentExpenses.filter(
                  (exp) => exp.categoryName === category.categoryName
                )

                return (
                  <div key={category.categoryName}>
                    <button
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : category.categoryName)
                      }
                      className={`w-full text-right p-3 rounded-xl transition-colors ${
                        isExpanded
                          ? 'bg-[#FFF3E0] dark:bg-[#2D1F0D]'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              isExpanded
                                ? 'bg-[#FF8A00] dark:bg-[#FFA94D] text-white'
                                : 'bg-[#FEECEC] dark:bg-[#2D1212] text-[#EF4444] dark:text-[#F87171]'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className={`font-medium text-sm ${getTextColorClass('primary')}`}>
                              {category.categoryIcon && (
                                <span className="ml-1">{category.categoryIcon}</span>
                              )}
                              {category.categoryName}
                            </div>
                            <div className={`text-xs ${getTextColorClass('secondary')}`}>
                              {category.percentage.toFixed(0)}% از کل هزینه‌ها
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`text-sm font-bold ${getTextColorClass('primary')}`}>
                            {(category.amount / 10).toLocaleString('fa-IR')}
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-600">
                              {' '}
                              تومان
                            </span>
                          </div>
                          <FamilyIcon
                            name="back"
                            size={16}
                            className={`transform transition-transform ${
                              isExpanded ? '-rotate-90' : 'rotate-180'
                            } ${getTextColorClass('secondary')}`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Expanded transactions */}
                    {isExpanded && relatedExpenses.length > 0 && (
                      <div className="mt-2 mr-11 space-y-1">
                        {relatedExpenses.slice(0, 5).map((expense) => (
                          <div
                            key={expense.id}
                            className="p-2 bg-white dark:bg-gray-900 rounded-lg text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-medium truncate ${getTextColorClass('primary')}`}
                                >
                                  {expense.title}
                                </div>
                                <div className={`${getTextColorClass('secondary')}`}>
                                  {expense.paidByName}
                                </div>
                              </div>
                              <div className="text-[#EF4444] dark:text-[#F87171] font-bold flex-shrink-0 mr-2">
                                {(expense.amount / 10).toLocaleString('fa-IR')}
                              </div>
                            </div>
                          </div>
                        ))}
                        {relatedExpenses.length > 5 && (
                          <div className={`text-center py-1 text-xs ${getTextColorClass('secondary')}`}>
                            و {relatedExpenses.length - 5} مورد دیگر
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section 6: Transaction List - Chronological */}
        {getAllTransactions().length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${getCardBackgroundClass()}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-bold ${getTextColorClass('secondary')}`}>
                تراکنش‌های این ماه
              </h2>
              <div className={`text-xs ${getTextColorClass('secondary')}`}>
                {getAllTransactions().length} مورد
              </div>
            </div>
            <div className="space-y-2">
              {getAllTransactions().slice(0, 20).map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-3 rounded-xl transition-colors ${
                    transaction.type === 'income'
                      ? 'bg-[#EAFBF1] dark:bg-[#0F2417] hover:bg-[#D4F7E0] dark:hover:bg-[#0F2417]/80'
                      : 'bg-[#FEECEC] dark:bg-[#2D1212] hover:bg-[#FDDDDD] dark:hover:bg-[#2D1212]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.type === 'income'
                            ? 'bg-[#22C55E]/10 dark:bg-[#22C55E]/20'
                            : 'bg-[#EF4444]/10 dark:bg-[#EF4444]/20'
                        }`}
                      >
                        <FamilyIcon
                          name={transaction.type === 'income' ? 'income' : 'expense'}
                          size={16}
                          className={
                            transaction.type === 'income'
                              ? 'text-[#22C55E] dark:text-[#4ADE80]'
                              : 'text-[#EF4444] dark:text-[#F87171]'
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${getTextColorClass('primary')}`}>
                          {transaction.title}
                        </div>
                        <div className={`text-xs flex items-center gap-2 ${getTextColorClass('secondary')}`}>
                          <span>
                            {transaction.type === 'income'
                              ? transaction.receivedByName
                              : transaction.paidByName}
                          </span>
                          {transaction.categoryName && (
                            <>
                              <span>•</span>
                              <span>{transaction.categoryName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold flex-shrink-0 mr-3 ${
                        transaction.type === 'income'
                          ? 'text-[#22C55E] dark:text-[#4ADE80]'
                          : 'text-[#EF4444] dark:text-[#F87171]'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '−'}
                      {(transaction.amount / 10).toLocaleString('fa-IR')}
                      <span className="text-xs font-normal text-gray-400 dark:text-gray-600">
                        {' '}
                        تومان
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {getAllTransactions().length > 20 && (
                <div className={`text-center py-2 text-xs ${getTextColorClass('secondary')}`}>
                  و {getAllTransactions().length - 20} مورد دیگر
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 7: Smart Insights - Optional */}
        {getSmartInsights().length > 0 && (
          <div className="bg-[#FFF3E0] dark:bg-[#2D1F0D] border border-[#FF8A00]/20 dark:border-[#FFA94D]/20 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <FamilyIcon
                name="tip"
                size={18}
                className="text-[#FF8A00] dark:text-[#FFA94D] flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className={`text-sm font-bold mb-2 ${getTextColorClass('primary')}`}>
                  نکات تحلیلی
                </h3>
                <div className={`space-y-1 text-xs ${getTextColorClass('secondary')}`}>
                  {getSmartInsights().map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No transactions */}
        {getAllTransactions().length === 0 && getAggregatedCategories().length === 0 && (
          <div className={`rounded-2xl p-12 text-center ${getCardBackgroundClass()}`}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#EEF2FF] dark:bg-[#1E1B3A]">
              <FamilyIcon name="emptyList" size={36} className="text-[#4F6EF7] dark:text-[#818CF8]" />
            </div>
            <h3 className={`text-[16px] font-bold mb-2 ${getTextColorClass('primary')}`}>
              هنوز تراکنشی برای {monthName} ثبت نشده
            </h3>
            <p className={`text-[13px] mb-6 ${getTextColorClass('secondary')}`}>
              اولین درآمد یا هزینه خودت رو ثبت کن
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/project/${projectId}/family/add-expense`)}
                className="bg-[#EF4444] dark:bg-[#F87171] hover:bg-[#DC2626] dark:hover:bg-[#EF4444] text-white px-6 py-3 rounded-xl font-medium transition-colors text-[14px] flex items-center gap-2"
              >
                <FamilyIcon name="expense" size={16} className="text-white" />
                ثبت هزینه
              </button>
              <button
                onClick={() => router.push(`/project/${projectId}/family/add-income`)}
                className="bg-[#22C55E] dark:bg-[#4ADE80] hover:bg-[#16A34A] dark:hover:bg-[#22C55E] text-white px-6 py-3 rounded-xl font-medium transition-colors text-[14px] flex items-center gap-2"
              >
                <FamilyIcon name="income" size={16} className="text-white" />
                ثبت درآمد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
