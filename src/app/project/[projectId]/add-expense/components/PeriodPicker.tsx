'use client'

import { useState, useMemo } from 'react'
import { BottomSheet } from '@/components/ui'

// ماه‌های شمسی
const PERSIAN_MONTHS = [
  { key: '01', name: 'فروردین' },
  { key: '02', name: 'اردیبهشت' },
  { key: '03', name: 'خرداد' },
  { key: '04', name: 'تیر' },
  { key: '05', name: 'مرداد' },
  { key: '06', name: 'شهریور' },
  { key: '07', name: 'مهر' },
  { key: '08', name: 'آبان' },
  { key: '09', name: 'آذر' },
  { key: '10', name: 'دی' },
  { key: '11', name: 'بهمن' },
  { key: '12', name: 'اسفند' },
]

interface PeriodPickerProps {
  value: string | null // "1403-10"
  onChange: (value: string) => void
  label: string
  required?: boolean
}

/**
 * انتخاب دوره زمانی (ماه شمسی)
 * خروجی: "1403-10" برای دی‌ماه ۱۴۰۳
 */
export function PeriodPicker({ value, onChange, label, required }: PeriodPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  // سال جاری شمسی (تقریبی - میلادی منهای ۶۲۱)
  const currentPersianYear = useMemo(() => {
    const now = new Date()
    // تقریب ساده: اگر قبل از ۲۱ مارس باشیم، سال شمسی یکی کمتر است
    const year = now.getFullYear() - 621
    const month = now.getMonth() // 0-11
    if (month < 2 || (month === 2 && now.getDate() < 21)) {
      return year - 1
    }
    return year
  }, [])

  // پارس کردن مقدار فعلی
  const parsedValue = useMemo(() => {
    if (!value) return { year: currentPersianYear, month: '01' }
    const [year, month] = value.split('-')
    return { year: parseInt(year), month }
  }, [value, currentPersianYear])

  // سال‌های قابل انتخاب (۳ سال قبل تا سال جاری)
  const availableYears = useMemo(() => {
    const years = []
    for (let y = currentPersianYear; y >= currentPersianYear - 3; y--) {
      years.push(y)
    }
    return years
  }, [currentPersianYear])

  const [selectedYear, setSelectedYear] = useState(parsedValue.year)
  const [selectedMonth, setSelectedMonth] = useState(parsedValue.month)

  const handleOpen = () => {
    // ست کردن مقادیر اولیه از value
    setSelectedYear(parsedValue.year)
    setSelectedMonth(parsedValue.month)
    setShowPicker(true)
  }

  const handleConfirm = () => {
    onChange(`${selectedYear}-${selectedMonth}`)
    setShowPicker(false)
  }

  // نمایش نام ماه
  const displayValue = useMemo(() => {
    if (!value) return null
    const monthInfo = PERSIAN_MONTHS.find((m) => m.key === parsedValue.month)
    return `${monthInfo?.name} ${parsedValue.year}`
  }, [value, parsedValue])

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
        <button
          type="button"
          onClick={handleOpen}
          className={`w-full px-4 py-3.5 rounded-xl text-right transition-all ${
            value
              ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
              : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent'
          }`}
        >
          <div className="flex items-center justify-between">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className={value ? 'font-medium' : 'text-gray-400'}>
              {displayValue || 'انتخاب ماه'}
            </span>
          </div>
        </button>
      </div>

      <BottomSheet
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title="انتخاب دوره"
      >
        <div className="space-y-4">
          {/* Year Selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">سال</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                    selectedYear === year
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Month Grid */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">ماه</label>
            <div className="grid grid-cols-4 gap-2">
              {PERSIAN_MONTHS.map((month) => (
                <button
                  key={month.key}
                  type="button"
                  onClick={() => setSelectedMonth(month.key)}
                  className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedMonth === month.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {month.name}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            تأیید - {PERSIAN_MONTHS.find((m) => m.key === selectedMonth)?.name} {selectedYear}
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
