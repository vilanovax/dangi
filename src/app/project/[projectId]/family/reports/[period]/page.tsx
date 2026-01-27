'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { FamilyDashboardStats } from '@/types/family'

export default function PeriodDetailReportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const period = params.period as string

  const [stats, setStats] = useState<FamilyDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-6 shadow-lg sticky top-0 z-10">
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
        {/* Financial Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-stone-800 mb-4">
            خلاصه مالی
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalIncome.toLocaleString('fa-IR')}
              </div>
              <div className="text-sm text-stone-600 mt-1">کل درآمد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.totalExpenses.toLocaleString('fa-IR')}
              </div>
              <div className="text-sm text-stone-600 mt-1">کل هزینه</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${stats.netSavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
              >
                {stats.netSavings >= 0 ? '+' : ''}
                {stats.netSavings.toLocaleString('fa-IR')}
              </div>
              <div className="text-sm text-stone-600 mt-1">خالص</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.savingsRate.toFixed(1)}%
              </div>
              <div className="text-sm text-stone-600 mt-1">نرخ پس‌انداز</div>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
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

          {/* Budget details */}
          {stats.budgets.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-stone-700 text-sm">
                جزئیات بودجه دسته‌بندی‌ها
              </h3>
              {stats.budgets.map((budget, index) => (
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
                      {budget.spent.toLocaleString('fa-IR')} /{' '}
                      {budget.budgetAmount.toLocaleString('fa-IR')}
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </div>

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

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-stone-800 mb-4">
            آخرین تراکنش‌ها
          </h2>

          {/* Recent Incomes */}
          {stats.recentIncomes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-green-700 mb-3">
                درآمدها
              </h3>
              <div className="space-y-2">
                {stats.recentIncomes.slice(0, 3).map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-stone-800">
                        {income.title}
                      </div>
                      <div className="text-xs text-stone-600">
                        {income.receivedByName}
                      </div>
                    </div>
                    <div className="text-green-700 font-bold">
                      +{income.amount.toLocaleString('fa-IR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          {stats.recentExpenses.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-700 mb-3">هزینه‌ها</h3>
              <div className="space-y-2">
                {stats.recentExpenses.slice(0, 3).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-stone-800">
                        {expense.title}
                      </div>
                      <div className="text-xs text-stone-600">
                        {expense.paidByName}
                      </div>
                    </div>
                    <div className="text-red-700 font-bold">
                      -{expense.amount.toLocaleString('fa-IR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
