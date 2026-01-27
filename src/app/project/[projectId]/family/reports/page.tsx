'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getCurrentPeriodKey,
  getCurrentPersianYear,
  getCurrentPersianMonth,
} from '@/lib/utils/persian-date'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { familyTheme } from '@/styles/family-theme'

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
          setReport({
            periodKey,
            totalIncome: data.stats.totalIncome,
            totalExpenses: data.stats.totalExpenses,
            netSavings: data.stats.netSavings,
            savingsRate: data.stats.savingsRate,
            topExpenses: data.stats.topExpenses || [],
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

  // تحلیل هوشمند
  const getInsightMessage = () => {
    if (!report) return ''

    if (report.savingsRate >= 20) {
      return 'این ماه عملکرد مالی‌تون عالی بوده 👏'
    }
    if (report.savingsRate >= 10) {
      return 'عملکرد مالی خوبی داشتی، ادامه بده 💪'
    }
    if (report.savingsRate >= 0) {
      return 'این ماه کمتر پس‌انداز کردی، ماه بعد بهتر می‌شه'
    }
    return 'این ماه خرج‌ها بیشتر از درآمد بوده، یکم بیشتر دقت کن ⚠️'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: familyTheme.colors.background }}>
      {/* Header - آبی استاندارد برای گزارش */}
      <div
        className="text-white p-5 shadow-lg sticky top-0 z-10"
        style={{ background: familyTheme.gradients.infoHeader }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ←
            </button>
            <div>
              <h1
                className="font-bold"
                style={{ fontSize: familyTheme.typography.pageTitle.size }}
              >
                گزارش‌های مالی
              </h1>
              <p
                className="text-white/80 mt-0.5"
                style={{ fontSize: familyTheme.typography.small.size }}
              >
                عملکرد مالی خانواده
              </p>
            </div>
          </div>

          {/* Month/Year Selector - Compact */}
          <button
            onClick={() => setShowMonthPicker(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl transition-colors"
          >
            <span
              className="font-bold"
              style={{ fontSize: familyTheme.typography.body.size }}
            >
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <span style={{ fontSize: familyTheme.typography.small.size }}>▾</span>
          </button>
        </div>
      </div>

      {/* Month Picker Bottom Sheet */}
      <BottomSheet isOpen={showMonthPicker} onClose={() => setShowMonthPicker(false)}>
        <div className="py-4">
          <h3 className="text-xl font-bold text-center text-stone-800 mb-6">
            انتخاب دوره گزارش
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Year selector */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                سال
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="block text-sm font-medium text-stone-700 mb-2">
                ماه
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            تأیید
          </button>
        </div>
      </BottomSheet>

      <div className="p-4 max-w-2xl mx-auto">

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-stone-600 mt-4">در حال بارگذاری گزارش...</p>
          </div>
        ) : !report ? (
          /* Empty State - هنوز گزارشی نیست */
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
              <span className="text-5xl">📊</span>
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-3">
              هنوز گزارشی برای این دوره نداریم
            </h2>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              با ثبت اولین تراکنش، گزارش ساخته می‌شه
            </p>
            <button
              onClick={() => router.push(`/project/${projectId}/family/add-expense`)}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <span>💸</span>
              <span>ثبت تراکنش</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero Report Card - داستان‌گو */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-indigo-100">
              <div className="text-center mb-6">
                <div className="text-xs text-stone-500 mb-2 uppercase tracking-wide">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </div>
                <div className="text-sm text-stone-600 mb-3">
                  وضعیت مالی ماه
                </div>
                <div className={`text-5xl font-black mb-2 ${report.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {report.netSavings >= 0 ? '+' : ''}
                  {(report.netSavings / 10).toLocaleString('fa-IR')}
                </div>
                <div className="text-xs text-stone-500 mb-1">تومان</div>
                <div className="text-sm text-stone-600 font-medium">
                  پس‌انداز خالص
                </div>
              </div>

              {/* سه شاخص کلیدی */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center">
                  <div className="text-xl mb-1">🟢</div>
                  <div className="text-xs text-stone-500 mb-1">درآمد</div>
                  <div className="text-base font-bold text-green-700">
                    {(report.totalIncome / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-1">🔴</div>
                  <div className="text-xs text-stone-500 mb-1">هزینه</div>
                  <div className="text-base font-bold text-red-700">
                    {(report.totalExpenses / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-1">📊</div>
                  <div className="text-xs text-stone-500 mb-1">پس‌انداز</div>
                  <div className="text-base font-bold text-blue-700">
                    {report.savingsRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* تحلیل هوشمند */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-indigo-900 mb-1">
                      تحلیل ماه
                    </div>
                    <div className="text-sm text-indigo-800 leading-relaxed">
                      {getInsightMessage()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* سهم دسته‌ها از هزینه - نمودار ساده */}
            {report.topExpenses && report.topExpenses.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-md">
                <div className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  <span>سهم دسته‌ها از هزینه</span>
                </div>
                <div className="space-y-3">
                  {report.topExpenses.slice(0, 5).map((category) => (
                    <div key={category.categoryName}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.categoryIcon}</span>
                          <span className="text-sm font-medium text-stone-800">
                            {category.categoryName}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-stone-700">
                          {category.percentage.toFixed(0)}%
                        </div>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* نکات این ماه - Insight Cards */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 shadow-md border border-indigo-200">
              <div className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>نکات این ماه</span>
              </div>
              <div className="space-y-3">
                {report.topExpenses && report.topExpenses.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <div className="text-sm text-indigo-800">
                      بیشترین خرج مربوط به «{report.topExpenses[0]?.categoryName}» بوده
                    </div>
                  </div>
                )}
                {report.savingsRate < 10 && (
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <div className="text-sm text-orange-800">
                      این ماه کمتر پس‌انداز کردی، سعی کن ماه بعد بهتر باشه
                    </div>
                  </div>
                )}
                {report.savingsRate >= 15 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div className="text-sm text-green-800">
                      پس‌انداز خوبی داشتی، همینطور ادامه بده 👏
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* گزارش کامل */}
            <button
              onClick={handleViewDetails}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 rounded-2xl p-5 shadow-lg transition-all text-white group"
            >
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <div className="font-bold text-lg mb-1">
                    📊 گزارش کامل این ماه
                  </div>
                  <div className="text-sm opacity-90">
                    جزئیات هزینه‌ها، درآمدها و بودجه
                  </div>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </button>

            {/* دسترسی سریع */}
            <div className="bg-white rounded-2xl p-5 shadow-md">
              <div className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span>🎯</span>
                <span>دسترسی سریع</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/budgets`)
                  }
                  className="bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl p-4 text-sm font-medium transition-all border border-amber-200 hover:border-amber-300"
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-amber-800">وضعیت بودجه</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/transactions`)
                  }
                  className="bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl p-4 text-sm font-medium transition-all border border-green-200 hover:border-green-300"
                >
                  <div className="text-2xl mb-2">📂</div>
                  <div className="text-green-800">همه تراکنش‌ها</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/recurring`)
                  }
                  className="bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-xl p-4 text-sm font-medium transition-all border border-purple-200 hover:border-purple-300"
                >
                  <div className="text-2xl mb-2">🔁</div>
                  <div className="text-purple-800">تراکنش تکراری</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/budgets/set`)
                  }
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl p-4 text-sm font-medium transition-all border border-blue-200 hover:border-blue-300"
                >
                  <div className="text-2xl mb-2">💰</div>
                  <div className="text-blue-800">تنظیم بودجه</div>
                </button>
              </div>
            </div>

            {/* پیام انگیزشی */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌱</span>
                <div className="text-sm text-indigo-800 leading-relaxed">
                  گزارش‌ها کمک می‌کنن الگوی خرج‌هات رو بشناسی.
                  با شناخت، تصمیم بهتر می‌گیری.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
