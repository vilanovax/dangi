'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { FamilyDashboardStats } from '@/types/family'
import { familyTheme } from '@/styles/family-theme'

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
        setStats(data.stats)
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

  // Smart analysis helpers
  const getFinancialNarrative = () => {
    if (!stats) return ''

    if (stats.netSavings > 0) {
      if (stats.savingsRate >= 20) {
        return `این ماه ${(stats.netSavings / 10).toLocaleString('fa-IR')} تومان پس‌انداز کردی، عالیه! 🎉`
      } else if (stats.savingsRate >= 10) {
        return `${(stats.netSavings / 10).toLocaleString('fa-IR')} تومان پس‌انداز این ماه، خوبه 👍`
      } else {
        return `پس‌انداز این ماه: ${(stats.netSavings / 10).toLocaleString('fa-IR')} تومان`
      }
    } else if (stats.netSavings < 0) {
      return `این ماه ${Math.abs(stats.netSavings / 10).toLocaleString('fa-IR')} تومان بیشتر از درآمد خرج کردی ⚠️`
    } else {
      return 'این ماه درآمد و هزینه برابر بوده'
    }
  }

  const getBudgetAnalysis = () => {
    if (!stats || stats.totalBudget === 0) return ''

    const util = stats.budgetUtilization
    if (util === 0) return 'هنوز از بودجه‌های تعیین شده استفاده نشده'
    if (util < 70) return 'بودجه این ماه به‌خوبی مدیریت شده 👌'
    if (util < 90) return 'داری نزدیک سقف بودجه می‌شی، کمی دقت کن'
    if (util < 100) return 'تقریباً تمام بودجه مصرف شده ⚠️'
    return 'بودجه این ماه رد شده، ماه بعد دقت بیشتری لازمه 🔴'
  }

  const getTopExpenseInsight = () => {
    if (!stats || stats.topExpenses.length === 0) return ''

    const top = stats.topExpenses[0]
    return `بیشترین هزینه این ماه مربوط به ${top.categoryName} بوده (${top.percentage.toFixed(0)}% از کل)`
  }

  // Filter meaningful budgets (only show if has spending or budget set)
  const getMeaningfulBudgets = () => {
    if (!stats) return []
    return stats.budgets.filter(b => b.spent > 0 || b.budgetAmount > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-stone-600">در حال بارگذاری...</div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
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
    <div className="min-h-screen" style={{ backgroundColor: familyTheme.colors.background }}>
      {/* Header با گرادیان آبی استاندارد */}
      <div
        className="text-white p-6 shadow-lg sticky top-0 z-10"
        style={{ background: familyTheme.gradients.infoHeader }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold">گزارش تفصیلی</h1>
              <p className="text-blue-100 text-sm">
                {monthName} {year}
              </p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-white text-indigo-600 px-4 py-2 rounded-full font-medium hover:bg-blue-50 transition-colors text-sm"
          >
            📥 دانلود CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Export Success Toast */}
        {showExportSuccess && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
            <div className="flex items-center gap-2">
              <span className="text-xl">✓</span>
              <span className="font-medium">فایل CSV دانلود شد</span>
            </div>
          </div>
        )}

        {/* Financial Summary - Narrative Style */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-8 shadow-xl text-white">
          {/* Main narrative */}
          <div className="text-center mb-6">
            <div className="text-sm opacity-90 mb-2">نتیجه مالی این ماه</div>
            <div className="text-2xl font-bold leading-relaxed">
              {getFinancialNarrative()}
            </div>
          </div>

          {/* Three key metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">🟢</div>
              <div className="text-xs opacity-80 mb-1">درآمد</div>
              <div className="text-lg font-bold">
                {(stats.totalIncome / 10).toLocaleString('fa-IR')}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">🔴</div>
              <div className="text-xs opacity-80 mb-1">هزینه</div>
              <div className="text-lg font-bold">
                {(stats.totalExpenses / 10).toLocaleString('fa-IR')}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">
                {stats.netSavings >= 0 ? '📊' : '⚠️'}
              </div>
              <div className="text-xs opacity-80 mb-1">
                {stats.netSavings >= 0 ? 'پس‌انداز' : 'کسری'}
              </div>
              <div className="text-lg font-bold">
                {Math.abs(stats.netSavings / 10).toLocaleString('fa-IR')}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Insights */}
        {(getBudgetAnalysis() || getTopExpenseInsight()) && (
          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">💡</div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-2">نکات تحلیلی</h3>
                <div className="space-y-2 text-sm text-amber-800">
                  {getBudgetAnalysis() && (
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{getBudgetAnalysis()}</span>
                    </div>
                  )}
                  {getTopExpenseInsight() && (
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{getTopExpenseInsight()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget Overview */}
        {stats.totalBudget > 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-stone-800 mb-4">
              وضعیت بودجه
            </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-stone-50 rounded-xl p-4">
              <div className="text-xl font-bold text-stone-800">
                {stats.totalBudget.toLocaleString('fa-IR')}
              </div>
              <div className="text-sm text-stone-600 mt-1">کل بودجه</div>
            </div>
            <div className="text-center bg-amber-50 rounded-xl p-4">
              <div className="text-xl font-bold text-amber-700">
                {stats.totalSpent.toLocaleString('fa-IR')}
              </div>
              <div className="text-sm text-stone-600 mt-1">مصرف شده</div>
            </div>
            <div className="text-center bg-indigo-50 rounded-xl p-4">
              <div className="text-xl font-bold text-indigo-600">
                {stats.budgetUtilization.toFixed(0)}%
              </div>
              <div className="text-sm text-stone-600 mt-1">درصد استفاده</div>
            </div>
          </div>

            {/* Budget details - only meaningful ones */}
            {getMeaningfulBudgets().length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-medium text-stone-700 text-sm">
                  جزئیات بودجه دسته‌بندی‌ها
                </h3>
                {getMeaningfulBudgets().map((budget, index) => (
                  <div key={index} className="border-t border-stone-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {budget.categoryIcon && (
                          <span>{budget.categoryIcon}</span>
                        )}
                        <span className="font-medium text-stone-800">
                          {budget.categoryName}
                        </span>
                      </div>
                      <div className="text-sm text-stone-600">
                        {(budget.spent / 10).toLocaleString('fa-IR')} /{' '}
                        {(budget.budgetAmount / 10).toLocaleString('fa-IR')}
                      </div>
                    </div>
                    {budget.spent === 0 && budget.budgetAmount > 0 ? (
                      <div className="text-xs text-stone-400 italic">
                        هنوز مصرفی ثبت نشده
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              budget.isOverBudget
                                ? 'bg-red-500'
                                : budget.percentage >= 90
                                  ? 'bg-orange-500'
                                  : budget.percentage >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${budget.isOverBudget ? 'text-red-600' : 'text-stone-600'}`}
                        >
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <div className="text-3xl mb-2">💭</div>
                <div className="text-sm">
                  بودجه تعیین شده ولی هنوز خرجی ثبت نشده
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl p-8 text-center border-2 border-dashed border-stone-200">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-stone-600 text-sm">
              برای این ماه بودجه‌ای تعیین نشده
            </div>
          </div>
        )}

        {/* Top Expenses */}
        {stats.topExpenses.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-stone-800 mb-4">
              بیشترین هزینه‌ها
            </h2>
            <div className="space-y-3">
              {stats.topExpenses.map((expense, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-stone-800">
                        {expense.categoryIcon} {expense.categoryName}
                      </div>
                      <div className="text-xs text-stone-500">
                        {expense.percentage.toFixed(1)}% از کل هزینه‌ها
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-stone-800">
                    {expense.amount.toLocaleString('fa-IR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions - Separated */}
        {(stats.recentIncomes.length > 0 || stats.recentExpenses.length > 0) && (
          <div className="space-y-4">
            {/* Recent Incomes */}
            {stats.recentIncomes.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-green-700">
                      💰 درآمدهای اخیر
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      {stats.recentIncomes.length > 5
                        ? '۵ مورد آخر'
                        : `${stats.recentIncomes.length} مورد`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {stats.recentIncomes.slice(0, 5).map((income) => (
                    <div
                      key={income.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-stone-800 truncate">
                          {income.title}
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-2">
                          <span>{income.receivedByName}</span>
                          {income.categoryName && (
                            <>
                              <span>•</span>
                              <span>{income.categoryName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-green-700 font-bold flex-shrink-0 mr-3">
                        +{(income.amount / 10).toLocaleString('fa-IR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Expenses */}
            {stats.recentExpenses.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-red-700">
                      💸 هزینه‌های اخیر
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      {stats.recentExpenses.length > 5
                        ? '۵ مورد آخر'
                        : `${stats.recentExpenses.length} مورد`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {stats.recentExpenses.slice(0, 5).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-stone-800 truncate">
                          {expense.title}
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-2">
                          <span>{expense.paidByName}</span>
                          {expense.categoryName && (
                            <>
                              <span>•</span>
                              <span>{expense.categoryName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-red-700 font-bold flex-shrink-0 mr-3">
                        −{(expense.amount / 10).toLocaleString('fa-IR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
