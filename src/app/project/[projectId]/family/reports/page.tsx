'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface MonthReport {
  periodKey: string
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
}

export default function ReportsOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Get current and previous months
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<MonthReport | null>(null)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">گزارش‌های مالی</h1>
        </div>
        <p className="text-blue-100 text-sm mr-14">
          گزارش عملکرد مالی خانواده
        </p>
      </div>

      {/* Month Selector */}
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-stone-800 mb-4">
            انتخاب دوره گزارش
          </h2>

          <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="text-center py-12 text-stone-600">
            در حال بارگذاری...
          </div>
        ) : report ? (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="text-center mb-6">
                <div className="text-lg mb-2 opacity-90">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </div>
                <div className="text-4xl font-bold mb-1">
                  {report.netSavings >= 0 ? '+' : ''}
                  {report.netSavings.toLocaleString('fa-IR')}
                </div>
                <div className="text-sm opacity-90">خالص پس‌انداز</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold mb-1">
                    {report.totalIncome.toLocaleString('fa-IR')}
                  </div>
                  <div className="text-sm opacity-90">درآمد</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold mb-1">
                    {report.totalExpenses.toLocaleString('fa-IR')}
                  </div>
                  <div className="text-sm opacity-90">هزینه</div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className="text-sm opacity-90 mb-1">نرخ پس‌انداز</div>
                <div className="text-2xl font-bold">
                  {report.savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleViewDetails}
                className="bg-white hover:bg-stone-50 rounded-2xl p-5 shadow-md transition-colors text-right group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-800 mb-1">
                      📊 گزارش تفصیلی
                    </div>
                    <div className="text-sm text-stone-600">
                      تحلیل کامل درآمد، هزینه و بودجه
                    </div>
                  </div>
                  <span className="text-stone-400 group-hover:text-indigo-500 transition-colors">
                    →
                  </span>
                </div>
              </button>

              <div className="bg-white rounded-2xl p-5 shadow-md">
                <div className="font-bold text-stone-800 mb-3">
                  🎯 دسترسی سریع
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      router.push(`/project/${projectId}/family/budgets/set`)
                    }
                    className="bg-amber-50 hover:bg-amber-100 rounded-xl p-3 text-sm text-amber-800 font-medium transition-colors"
                  >
                    💰 تنظیم بودجه
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/project/${projectId}/family/recurring`)
                    }
                    className="bg-purple-50 hover:bg-purple-100 rounded-xl p-3 text-sm text-purple-800 font-medium transition-colors"
                  >
                    🔄 تراکنش‌های تکراری
                  </button>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">راهنما</p>
                  <p className="text-blue-700">
                    برای مشاهده جزئیات کامل هر دوره، روی "گزارش تفصیلی" کلیک
                    کنید. می‌توانید داده‌ها را به صورت CSV دانلود کنید.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <p className="text-stone-600">اطلاعاتی برای این دوره یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  )
}
