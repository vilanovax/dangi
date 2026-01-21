'use client'

import { formatInputAmount, getCurrencyLabel, formatMoney } from '@/lib/utils/money'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency: string
  label: string
  placeholder: string
  sharePerPerson: number | null
  participantCount: number
  participantTerm: string
}

/**
 * ورودی مبلغ - با اندازه متناسب و خوانا
 * سهم هر نفر به صورت ثانویه نمایش داده می‌شود
 */
export function AmountInput({
  value,
  onChange,
  currency,
  label,
  placeholder,
  sharePerPerson,
  participantCount,
  participantTerm,
}: AmountInputProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 text-center">
      <label className="block text-sm text-gray-500 mb-2">{label}</label>

      <div className="flex items-center justify-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(formatInputAmount(e.target.value))}
          className="text-3xl font-bold text-center w-full bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
        <span className="text-base text-gray-400 font-medium">
          {getCurrencyLabel(currency)}
        </span>
      </div>

      {/* سهم هر نفر - نمایش ثانویه و قابل تغییر */}
      {sharePerPerson !== null && participantCount > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          فعلاً سهم هر {participantTerm}:{' '}
          <span className="text-gray-500">{formatMoney(sharePerPerson, currency)}</span>
          <span className="text-gray-300 mr-1">(قابل تغییر)</span>
        </p>
      )}
    </div>
  )
}
