'use client'

import { formatInputAmount, getCurrencyLabel } from '@/lib/utils/money'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency: string
}

/**
 * Hero amount input for settlements
 *
 * UX Intent:
 * - This is the ONLY important thing on this page
 * - Large, prominent, impossible to miss
 * - Green focus state for settlement identity
 */
export function AmountInput({ value, onChange, currency }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatInputAmount(e.target.value))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        مبلغ پرداختی
      </label>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border border-green-100 dark:border-green-800/30 p-5 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            placeholder="۰"
            className="flex-1 text-4xl font-bold text-center bg-transparent border-none outline-none placeholder:text-green-300 dark:placeholder:text-green-800 text-green-700 dark:text-green-300"
            dir="ltr"
          />
          <span className="text-base text-green-600 dark:text-green-400 font-medium flex-shrink-0">
            {getCurrencyLabel(currency)}
          </span>
        </div>
      </div>
    </div>
  )
}
