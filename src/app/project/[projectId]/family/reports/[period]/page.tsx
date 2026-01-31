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
import { designTokens as dt } from '@/styles/design-tokens'
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
      date: item.date instanceof Date ? item.date : new Date(item.date),
    }))

    const expenses = stats.recentExpenses.map((item) => ({
      ...item,
      type: 'expense' as const,
      date: item.date instanceof Date ? item.date : new Date(item.date),
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
      <div className={`min-h-screen ${getBackgroundClass()}`} style={{ padding: dt.spacing[6] }}>
        <div className="max-w-2xl mx-auto">
          <div
            style={{
              backgroundColor: dt.colors.semantic.expenseSoft,
              borderColor: `${dt.colors.semantic.expense}33`,
              color: dt.colors.semantic.expense,
              padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
              borderRadius: dt.radius.lg,
              borderWidth: 1,
            }}
          >
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
      <div
        className={`text-white shadow-lg sticky top-0 z-10 ${getHeaderGradient('info')}`}
        style={{ padding: dt.spacing[6] }}
      >
        {/* Breadcrumb - Subtle */}
        <div
          className="flex items-center opacity-75"
          style={{ gap: dt.spacing[1.5], marginBottom: dt.spacing[3], fontSize: dt.typography.sizes.caption }}
        >
          <span>خانه</span>
          <FamilyIcon name="back" size={10} className="text-white rotate-180" />
          <span>گزارش‌ها</span>
          <FamilyIcon name="back" size={10} className="text-white rotate-180" />
          <span className="opacity-100 font-medium">{monthName} {year}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: dt.spacing[4] }}>
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full transition-colors"
              style={{ padding: dt.spacing[2] }}
              aria-label="بازگشت"
            >
              <FamilyIcon name="back" size={24} className="text-white" />
            </button>
            <div>
              <h1 className="font-bold" style={{ fontSize: dt.typography.sizes.title }}>
                گزارش کامل {monthName}
              </h1>
              <p className="text-white/80" style={{ fontSize: dt.typography.sizes.body, marginTop: dt.spacing[0.5] }}>
                تحلیل عمیق و جزئیات مالی
              </p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-white font-medium hover:bg-white/90 dark:hover:bg-white/80 transition-colors flex items-center rounded-full"
            style={{
              color: dt.colors.semantic.info,
              padding: `${dt.spacing[2]}px ${dt.spacing[4]}px`,
              fontSize: dt.typography.sizes.body,
              gap: dt.spacing[2],
            }}
          >
            <FamilyIcon name="backup" size={16} style={{ color: dt.colors.semantic.info }} />
            CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto" style={{ padding: dt.spacing[6], gap: dt.spacing[6], display: 'flex', flexDirection: 'column' }}>
        {/* Export Success Toast */}
        {showExportSuccess && (
          <div
            className="fixed top-24 left-1/2 -translate-x-1/2 text-white rounded-full shadow-lg z-50 animate-bounce"
            style={{ backgroundColor: dt.colors.semantic.income, padding: `${dt.spacing[3]}px ${dt.spacing[6]}px` }}
          >
            <div className="flex items-center" style={{ gap: dt.spacing[2] }}>
              <FamilyIcon name="success" size={20} className="text-white" />
              <span className="font-medium">فایل CSV دانلود شد</span>
            </div>
          </div>
        )}

        {/* Section 2: Financial Summary - Compact */}
        <div
          className={getCardBackgroundClass()}
          style={{ borderRadius: dt.radius.xl, padding: dt.spacing[5], boxShadow: dt.shadow.card }}
        >
          <h2
            className={`font-bold ${getTextColorClass('secondary')}`}
            style={{ fontSize: dt.typography.sizes.body, marginBottom: dt.spacing[4] }}
          >
            خلاصه مالی
          </h2>
          <div className="grid grid-cols-2" style={{ gap: dt.spacing[4] }}>
            {/* Net Savings */}
            <div
              className="col-span-2 bg-gray-50 dark:bg-gray-800 text-center"
              style={{ borderRadius: dt.radius.lg, padding: dt.spacing[4] }}
            >
              <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption, marginBottom: dt.spacing[1] }}>
                خالص پس‌انداز
              </div>
              <div
                className={`font-black ${
                  stats.netSavings >= 0
                    ? getTextColorClass('success')
                    : getTextColorClass('danger')
                }`}
                style={{ fontSize: 30 }}
              >
                {stats.netSavings >= 0 ? '+' : ''}
                {(stats.netSavings / 10).toLocaleString('fa-IR')}
                <span className="font-medium text-gray-400 dark:text-gray-600" style={{ fontSize: dt.typography.sizes.caption }}>
                  {' '}
                  تومان
                </span>
              </div>
              <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption, marginTop: dt.spacing[1] }}>
                نرخ پس‌انداز: {stats.savingsRate.toFixed(1)}%
              </div>
            </div>

            {/* Total Income */}
            <div
              style={{
                backgroundColor: dt.colors.semantic.incomeSoft,
                borderRadius: dt.radius.lg,
                padding: dt.spacing[4],
              }}
            >
              <div className="flex items-center" style={{ gap: dt.spacing[2], marginBottom: dt.spacing[2] }}>
                <FamilyIcon name="income" size={16} style={{ color: dt.colors.semantic.income }} />
                <span className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption }}>
                  کل درآمد
                </span>
              </div>
              <div className="font-bold" style={{ fontSize: dt.typography.sizes.title, color: dt.colors.semantic.income }}>
                {(stats.totalIncome / 10).toLocaleString('fa-IR')}
                <span className="font-medium text-gray-400 dark:text-gray-600" style={{ fontSize: dt.typography.sizes.caption }}>
                  {' '}
                  تومان
                </span>
              </div>
            </div>

            {/* Total Expenses */}
            <div
              style={{
                backgroundColor: dt.colors.semantic.expenseSoft,
                borderRadius: dt.radius.lg,
                padding: dt.spacing[4],
              }}
            >
              <div className="flex items-center" style={{ gap: dt.spacing[2], marginBottom: dt.spacing[2] }}>
                <FamilyIcon name="expense" size={16} style={{ color: dt.colors.semantic.expense }} />
                <span className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption }}>
                  کل هزینه
                </span>
              </div>
              <div className="font-bold" style={{ fontSize: dt.typography.sizes.title, color: dt.colors.semantic.expense }}>
                {(stats.totalExpenses / 10).toLocaleString('fa-IR')}
                <span className="font-medium text-gray-400 dark:text-gray-600" style={{ fontSize: dt.typography.sizes.caption }}>
                  {' '}
                  تومان
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Expense Distribution Chart */}
        {getAggregatedCategories().length > 0 && (
          <div
            className={getCardBackgroundClass()}
            style={{ borderRadius: dt.radius.xl, padding: dt.spacing[5], boxShadow: dt.shadow.card }}
          >
            <h2
              className={`font-bold ${getTextColorClass('secondary')}`}
              style={{ fontSize: dt.typography.sizes.body, marginBottom: dt.spacing[4] }}
            >
              توزیع هزینه‌ها
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
              {getAggregatedCategories().map((category, index) => {
                const barColor =
                  index === 0
                    ? dt.colors.semantic.expense
                    : index === 1
                      ? dt.colors.brand.primary
                      : index === 2
                        ? dt.colors.semantic.warning
                        : dt.colors.text.secondary

                return (
                  <div key={category.categoryName}>
                    <div className="flex items-center justify-between" style={{ marginBottom: dt.spacing[1] }}>
                      <div className="flex items-center" style={{ gap: dt.spacing[2] }}>
                        {category.categoryIcon && (
                          <span style={{ fontSize: dt.typography.sizes.body }}>{category.categoryIcon}</span>
                        )}
                        <span className={`font-medium ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                          {category.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
                        <span className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption }}>
                          {(category.amount / 10).toLocaleString('fa-IR')} تومان
                        </span>
                        <span className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                          {category.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden" style={{ height: 10 }}>
                      <div
                        className="h-full transition-all"
                        style={{ width: `${category.percentage}%`, backgroundColor: barColor }}
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
          <div
            className={getCardBackgroundClass()}
            style={{ borderRadius: dt.radius.xl, padding: dt.spacing[5], boxShadow: dt.shadow.card }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: dt.spacing[4] }}>
              <h2 className={`font-bold ${getTextColorClass('secondary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                وضعیت بودجه
              </h2>
              <div
                className="font-bold"
                style={{
                  fontSize: dt.typography.sizes.title,
                  color:
                    stats.budgetUtilization >= 100
                      ? dt.colors.semantic.expense
                      : stats.budgetUtilization >= 90
                        ? dt.colors.brand.primary
                        : dt.colors.semantic.info,
                }}
              >
                {stats.budgetUtilization.toFixed(0)}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
              {stats.budgets
                .filter((b) => b.spent > 0 || b.budgetAmount > 0)
                .map((budget, index) => {
                  const getBarColor = () => {
                    if (budget.isOverBudget) return dt.colors.semantic.expense
                    if (budget.percentage >= 90) return dt.colors.brand.primary
                    if (budget.percentage >= 70) return dt.colors.semantic.warning
                    return dt.colors.semantic.income
                  }

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between" style={{ marginBottom: dt.spacing[1] }}>
                        <div className="flex items-center" style={{ gap: dt.spacing[2] }}>
                          {budget.categoryIcon && <span style={{ fontSize: dt.typography.sizes.body }}>{budget.categoryIcon}</span>}
                          <span className={`font-medium ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                            {budget.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center" style={{ gap: dt.spacing[2] }}>
                          <span className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption }}>
                            {(budget.spent / 10).toLocaleString('fa-IR')} /{' '}
                            {(budget.budgetAmount / 10).toLocaleString('fa-IR')}
                          </span>
                          <span
                            className="font-bold"
                            style={{
                              fontSize: dt.typography.sizes.body,
                              color: budget.isOverBudget ? dt.colors.semantic.expense : dt.colors.text.secondary,
                            }}
                          >
                            {budget.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden" style={{ height: 8 }}>
                        <div
                          className="h-full transition-all"
                          style={{ width: `${Math.min(budget.percentage, 100)}%`, backgroundColor: getBarColor() }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Section 4: Category Drill-Down List */}
        {getAggregatedCategories().length > 0 && (
          <div
            className={getCardBackgroundClass()}
            style={{ borderRadius: dt.radius.xl, padding: dt.spacing[5], boxShadow: dt.shadow.card }}
          >
            <h2
              className={`font-bold ${getTextColorClass('secondary')}`}
              style={{ fontSize: dt.typography.sizes.body, marginBottom: dt.spacing[4] }}
            >
              دسته‌بندی‌های هزینه
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[2] }}>
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
                      className="w-full text-right transition-colors"
                      style={{
                        padding: dt.spacing[3],
                        borderRadius: dt.radius.lg,
                        backgroundColor: isExpanded
                          ? dt.colors.brand.primarySoft
                          : 'rgb(249, 250, 251)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
                          <div
                            className="rounded-full flex items-center justify-center font-bold"
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: dt.typography.sizes.body,
                              backgroundColor: isExpanded ? dt.colors.brand.primary : dt.colors.semantic.expenseSoft,
                              color: isExpanded ? 'white' : dt.colors.semantic.expense,
                            }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className={`font-medium ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                              {category.categoryIcon && (
                                <span className="ml-1">{category.categoryIcon}</span>
                              )}
                              {category.categoryName}
                            </div>
                            <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption }}>
                              {category.percentage.toFixed(0)}% از کل هزینه‌ها
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
                          <div className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                            {(category.amount / 10).toLocaleString('fa-IR')}
                            <span className="font-normal text-gray-400 dark:text-gray-600" style={{ fontSize: dt.typography.sizes.caption }}>
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
                      <div style={{ marginTop: dt.spacing[2], marginRight: 44, display: 'flex', flexDirection: 'column', gap: dt.spacing[1] }}>
                        {relatedExpenses.slice(0, 5).map((expense) => (
                          <div
                            key={expense.id}
                            className="bg-white dark:bg-gray-900"
                            style={{ padding: dt.spacing[2], borderRadius: dt.radius.md, fontSize: dt.typography.sizes.caption }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${getTextColorClass('primary')}`}>
                                  {expense.title}
                                </div>
                                <div className={getTextColorClass('secondary')}>
                                  {expense.paidByName}
                                </div>
                              </div>
                              <div className="font-bold flex-shrink-0" style={{ color: dt.colors.semantic.expense, marginRight: dt.spacing[2] }}>
                                {(expense.amount / 10).toLocaleString('fa-IR')}
                              </div>
                            </div>
                          </div>
                        ))}
                        {relatedExpenses.length > 5 && (
                          <div className={`text-center ${getTextColorClass('secondary')}`} style={{ paddingTop: dt.spacing[1], fontSize: dt.typography.sizes.caption }}>
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
          <div
            className={getCardBackgroundClass()}
            style={{ borderRadius: dt.radius.xl, padding: dt.spacing[5], boxShadow: dt.shadow.card }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: dt.spacing[4] }}>
              <h2 className={`font-bold ${getTextColorClass('secondary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                تراکنش‌های این ماه
              </h2>
              <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption }}>
                {getAllTransactions().length} مورد
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[2] }}>
              {getAllTransactions().slice(0, 20).map((transaction) => (
                <div
                  key={transaction.id}
                  className="transition-colors"
                  style={{
                    padding: dt.spacing[3],
                    borderRadius: dt.radius.lg,
                    backgroundColor:
                      transaction.type === 'income'
                        ? dt.colors.semantic.incomeSoft
                        : dt.colors.semantic.expenseSoft,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0" style={{ gap: dt.spacing[3] }}>
                      <div
                        className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor:
                            transaction.type === 'income'
                              ? `${dt.colors.semantic.income}1A`
                              : `${dt.colors.semantic.expense}1A`,
                        }}
                      >
                        <FamilyIcon
                          name={transaction.type === 'income' ? 'income' : 'expense'}
                          size={16}
                          style={{
                            color:
                              transaction.type === 'income'
                                ? dt.colors.semantic.income
                                : dt.colors.semantic.expense,
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body }}>
                          {transaction.title}
                        </div>
                        <div className={`flex items-center ${getTextColorClass('secondary')}`} style={{ fontSize: dt.typography.sizes.caption, gap: dt.spacing[2] }}>
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
                      className="font-bold flex-shrink-0"
                      style={{
                        fontSize: dt.typography.sizes.body,
                        marginRight: dt.spacing[3],
                        color:
                          transaction.type === 'income'
                            ? dt.colors.semantic.income
                            : dt.colors.semantic.expense,
                      }}
                    >
                      {transaction.type === 'income' ? '+' : '−'}
                      {(transaction.amount / 10).toLocaleString('fa-IR')}
                      <span className="font-normal text-gray-400 dark:text-gray-600" style={{ fontSize: dt.typography.sizes.caption }}>
                        {' '}
                        تومان
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {getAllTransactions().length > 20 && (
                <div className={`text-center ${getTextColorClass('secondary')}`} style={{ paddingTop: dt.spacing[2], paddingBottom: dt.spacing[2], fontSize: dt.typography.sizes.caption }}>
                  و {getAllTransactions().length - 20} مورد دیگر
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 7: Smart Insights - Optional */}
        {getSmartInsights().length > 0 && (
          <div
            style={{
              backgroundColor: dt.colors.brand.primarySoft,
              borderColor: `${dt.colors.brand.primary}33`,
              borderWidth: 1,
              borderRadius: dt.radius.xl,
              padding: dt.spacing[4],
            }}
          >
            <div className="flex items-start" style={{ gap: dt.spacing[2] }}>
              <FamilyIcon
                name="tip"
                size={18}
                className="flex-shrink-0"
                style={{ color: dt.colors.brand.primary, marginTop: dt.spacing[0.5] }}
              />
              <div>
                <h3 className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.body, marginBottom: dt.spacing[2] }}>
                  نکات تحلیلی
                </h3>
                <div className={getTextColorClass('secondary')} style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[1], fontSize: dt.typography.sizes.caption }}>
                  {getSmartInsights().map((insight, index) => (
                    <div key={index} className="flex items-start" style={{ gap: dt.spacing[2] }}>
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
          <div className={`text-center ${getCardBackgroundClass()}`} style={{ borderRadius: dt.radius.xl, padding: dt.spacing[12] }}>
            <div
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                marginBottom: dt.spacing[4],
                backgroundColor: dt.colors.semantic.infoSoft,
              }}
            >
              <FamilyIcon name="emptyList" size={36} style={{ color: dt.colors.semantic.info }} />
            </div>
            <h3 className={`font-bold ${getTextColorClass('primary')}`} style={{ fontSize: dt.typography.sizes.bodyLarge, marginBottom: dt.spacing[2] }}>
              هنوز تراکنشی برای {monthName} ثبت نشده
            </h3>
            <p className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.body, marginBottom: dt.spacing[6] }}>
              اولین درآمد یا هزینه خودت رو ثبت کن
            </p>
            <div className="flex justify-center" style={{ gap: dt.spacing[3] }}>
              <button
                onClick={() => router.push(`/project/${projectId}/family/add-expense`)}
                className="text-white font-medium transition-colors flex items-center"
                style={{
                  backgroundColor: dt.colors.semantic.expense,
                  padding: `${dt.spacing[3]}px ${dt.spacing[6]}px`,
                  borderRadius: dt.radius.lg,
                  fontSize: dt.typography.sizes.body,
                  gap: dt.spacing[2],
                }}
              >
                <FamilyIcon name="expense" size={16} className="text-white" />
                ثبت هزینه
              </button>
              <button
                onClick={() => router.push(`/project/${projectId}/family/add-income`)}
                className="text-white font-medium transition-colors flex items-center"
                style={{
                  backgroundColor: dt.colors.semantic.income,
                  padding: `${dt.spacing[3]}px ${dt.spacing[6]}px`,
                  borderRadius: dt.radius.lg,
                  fontSize: dt.typography.sizes.body,
                  gap: dt.spacing[2],
                }}
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
