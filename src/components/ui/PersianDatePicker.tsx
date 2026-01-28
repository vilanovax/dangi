'use client'

import { useState, useEffect } from 'react'
import DatePicker, { DateObject } from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'

interface PersianDatePickerProps {
  value: Date | string
  onChange: (date: Date) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function PersianDatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'انتخاب تاریخ',
  className = '',
}: PersianDatePickerProps) {
  const [dateValue, setDateValue] = useState(() => new DateObject(value))

  // Update internal state when value prop changes (e.g., from "Today" or "Yesterday" buttons)
  useEffect(() => {
    setDateValue(new DateObject(value))
  }, [value])

  const handleChange = (date: DateObject | null) => {
    if (date) {
      setDateValue(date)
      onChange(date.toDate())
    }
  }

  return (
    <DatePicker
      value={dateValue}
      onChange={handleChange}
      calendar={persian}
      locale={persian_fa}
      disabled={disabled}
      placeholder={placeholder}
      format="DD MMMM YYYY"
      containerClassName="w-full"
      inputClass={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-right ${className}`}
      calendarPosition="bottom-right"
    />
  )
}
