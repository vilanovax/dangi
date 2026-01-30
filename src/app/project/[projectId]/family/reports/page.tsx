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
          <div className="space-y-4">
            {/* Hero Report Card - داستان‌گو */}
            <div className={`rounded-3xl p-6 shadow-2xl border-2 border-gray-200 dark:border-gray-700 ${getCardBackgroundClass()}`}>
              <div className="text-center mb-6">
                <div className={`text-xs mb-2 uppercase tracking-wide ${getTextColorClass('secondary')}`}>
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </div>
                <div className={`text-sm mb-3 ${getTextColorClass('secondary')}`}>
                  وضعیت مالی ماه
                </div>
                <div className={`text-5xl font-black mb-2 ${report.netSavings >= 0 ? 'text-[#22C55E] dark:text-[#4ADE80]' : 'text-[#EF4444] dark:text-[#F87171]'}`}>
                  {report.netSavings >= 0 ? '+' : ''}
                  {(report.netSavings / 10).toLocaleString('fa-IR')}
                </div>
                <div className={`text-xs mb-1 ${getTextColorClass('secondary')}`}>تومان</div>
                <div className={`text-sm font-medium ${getTextColorClass('primary')}`}>
                  پس‌انداز خالص
                </div>
              </div>

              {/* سه شاخص کلیدی */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-50 dark:bg-green-950/30">
                    <FamilyIcon name="income" size={20} className="text-[#22C55E] dark:text-[#4ADE80]" />
                  </div>
                  <div className={`text-xs mb-1 ${getTextColorClass('secondary')}`}>درآمد</div>
                  <div className={`text-base font-bold ${getTextColorClass('success')}`}>
                    {(report.totalIncome / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-red-50 dark:bg-red-950/30">
                    <FamilyIcon name="expense" size={20} className="text-[#EF4444] dark:text-[#F87171]" />
                  </div>
                  <div className={`text-xs mb-1 ${getTextColorClass('secondary')}`}>هزینه</div>
                  <div className={`text-base font-bold ${getTextColorClass('danger')}`}>
                    {(report.totalExpenses / 10).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-orange-50 dark:bg-orange-950/30">
                    <FamilyIcon name="savings" size={20} className="text-[#FF8A00] dark:text-[#FFA94D]" />
                  </div>
                  <div className={`text-xs mb-1 ${getTextColorClass('secondary')}`}>پس‌انداز</div>
                  <div className={`text-base font-bold ${getTextColorClass('info')}`}>
                    {(report.savingsRate ?? 0).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* تحلیل هوشمند */}
              <div className="bg-[#EEF2FF] dark:bg-[#1E1B3A] rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <FamilyIcon name="tip" size={18} className="text-[#4F6EF7] dark:text-[#818CF8] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className={`text-xs font-bold mb-1 ${getTextColorClass('info')}`}>
                      تحلیل ماه
                    </div>
                    <div className={`text-sm leading-relaxed ${getTextColorClass('info')}`}>
                      {getInsightMessage()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* سهم دسته‌ها از هزینه - نمودار ساده */}
            {report.topExpenses && report.topExpenses.length > 0 && (
              <div className={`rounded-2xl p-5 shadow-md ${getCardBackgroundClass()}`}>
                <div className={`font-bold mb-4 flex items-center gap-2 ${getTextColorClass('primary')}`}>
                  <FamilyIcon name="reports" size={20} />
                  <span>سهم دسته‌ها از هزینه</span>
                </div>
                <div className="space-y-3">
                  {report.topExpenses.slice(0, 5).map((category) => (
                    <div key={category.categoryName}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.categoryIcon}</span>
                          <span className={`text-sm font-medium ${getTextColorClass('primary')}`}>
                            {category.categoryName}
                          </span>
                        </div>
                        <div className={`text-sm font-bold ${getTextColorClass('primary')}`}>
                          {category.percentage.toFixed(0)}%
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#4F6EF7] dark:bg-[#818CF8] transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* نکات این ماه - Insight Cards */}
            <div className="bg-[#EEF2FF] dark:bg-[#1E1B3A] rounded-2xl p-5 shadow-md border-2 border-blue-200 dark:border-blue-800">
              <div className={`font-bold mb-4 flex items-center gap-2 ${getTextColorClass('info')}`}>
                <FamilyIcon name="tip" size={20} className="text-[#4F6EF7] dark:text-[#818CF8]" />
                <span>نکات این ماه</span>
              </div>
              <div className="space-y-3">
                {report.topExpenses && report.topExpenses.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className={`font-bold ${getTextColorClass('info')}`}>•</span>
                    <div className={`text-sm ${getTextColorClass('info')}`}>
                      بیشترین خرج مربوط به «{report.topExpenses[0]?.categoryName}» بوده
                    </div>
                  </div>
                )}
                {report.savingsRate < 10 && (
                  <div className="flex items-start gap-2">
                    <span className={`font-bold ${getTextColorClass('primary')}`}>•</span>
                    <div className={`text-sm ${getTextColorClass('primary')}`}>
                      این ماه کمتر پس‌انداز کردی، سعی کن ماه بعد بهتر باشه
                    </div>
                  </div>
                )}
                {report.savingsRate >= 15 && (
                  <div className="flex items-start gap-2">
                    <span className={`font-bold ${getTextColorClass('success')}`}>•</span>
                    <div className={`text-sm ${getTextColorClass('success')}`}>
                      پس‌انداز خوبی داشتی، همینطور ادامه بده 👏
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* گزارش کامل */}
            <button
              onClick={handleViewDetails}
              className="w-full bg-[#4F6EF7] dark:bg-[#818CF8] hover:bg-[#6D83FF] dark:hover:bg-[#6D83FF] rounded-2xl p-5 shadow-lg transition-all text-white group"
            >
              <div className="flex items-center justify-between">
                <div className="text-right flex items-center gap-3">
                  <FamilyIcon name="reports" size={24} className="text-white" />
                  <div>
                    <div className="font-bold text-lg mb-1">
                      گزارش کامل این ماه
                    </div>
                    <div className="text-sm opacity-90">
                      جزئیات هزینه‌ها، درآمدها و بودجه
                    </div>
                  </div>
                </div>
                <FamilyIcon name="back" size={24} className="text-white rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* دسترسی سریع */}
            <div className={`rounded-2xl p-5 shadow-md ${getCardBackgroundClass()}`}>
              <div className={`font-bold mb-4 flex items-center gap-2 ${getTextColorClass('primary')}`}>
                <FamilyIcon name="budget" size={20} />
                <span>دسترسی سریع</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/budgets`)
                  }
                  className="bg-[#FFF3E0] dark:bg-[#2D1F0D] hover:bg-[#FFE4C4] dark:hover:bg-[#3D2F1D] rounded-xl p-4 text-sm font-medium transition-all border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700"
                >
                  <div className="w-8 h-8 mb-2 mx-auto rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                    <FamilyIcon name="budget" size={18} className="text-[#FF8A00] dark:text-[#FFA94D]" />
                  </div>
                  <div className={getTextColorClass('primary')}>وضعیت بودجه</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/transactions`)
                  }
                  className="bg-[#EAFBF1] dark:bg-[#0F2417] hover:bg-[#D4F7E0] dark:hover:bg-[#1F3427] rounded-xl p-4 text-sm font-medium transition-all border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700"
                >
                  <div className="w-8 h-8 mb-2 mx-auto rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                    <FamilyIcon name="transactions" size={18} className="text-[#22C55E] dark:text-[#4ADE80]" />
                  </div>
                  <div className={getTextColorClass('primary')}>همه تراکنش‌ها</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/recurring`)
                  }
                  className="bg-[#EEF2FF] dark:bg-[#1E1B3A] hover:bg-[#DDE4FF] dark:hover:bg-[#2E2B4A] rounded-xl p-4 text-sm font-medium transition-all border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700"
                >
                  <div className="w-8 h-8 mb-2 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <FamilyIcon name="recurring" size={18} className="text-[#4F6EF7] dark:text-[#818CF8]" />
                  </div>
                  <div className={getTextColorClass('primary')}>تراکنش تکراری</div>
                </button>
                <button
                  onClick={() =>
                    router.push(`/project/${projectId}/family/budgets/set`)
                  }
                  className="bg-[#EEF2FF] dark:bg-[#1E1B3A] hover:bg-[#DDE4FF] dark:hover:bg-[#2E2B4A] rounded-xl p-4 text-sm font-medium transition-all border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="w-8 h-8 mb-2 mx-auto rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                    <FamilyIcon name="wallet" size={18} className="text-[#FF8A00] dark:text-[#FFA94D]" />
                  </div>
                  <div className={getTextColorClass('primary')}>تنظیم بودجه</div>
                </button>
              </div>
            </div>

            {/* پیام انگیزشی */}
            <div className="bg-[#EEF2FF] dark:bg-[#1E1B3A] border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FamilyIcon name="info" size={20} className="text-[#4F6EF7] dark:text-[#818CF8] flex-shrink-0 mt-0.5" />
                <div className={`text-sm leading-relaxed ${getTextColorClass('info')}`}>
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
