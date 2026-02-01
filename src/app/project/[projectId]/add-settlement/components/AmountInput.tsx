'use client'

import { formatInputAmount, getCurrencyLabel } from '@/lib/utils/money'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency: string
  error?: string
}

/**
 * Hero amount input for settlements
 *
 * UX Intent:
 * - This is the ONLY important thing on this page
 * - Large, prominent, impossible to miss
 * - Green focus state for settlement identity
 */
export function AmountInput({ value, onChange, currency, error }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatInputAmount(e.target.value))
  }

  const hasError = !!error

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        مبلغ پرداختی
      </label>
      <div className={`bg-gradient-to-br rounded-2xl border p-5 focus-within:ring-2 transition-all shadow-sm ${
        hasError
          ? 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800/50 focus-within:ring-red-500 focus-within:border-transparent'
          : 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-100 dark:border-green-800/30 focus-within:ring-green-500 focus-within:border-transparent'
      }`}>
        <div className="flex items-center justify-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            placeholder="۰"
            className={`flex-1 text-4xl font-bold text-center bg-transparent border-none outline-none ${
              hasError
                ? 'placeholder:text-red-300 dark:placeholder:text-red-800 text-red-700 dark:text-red-300'
                : 'placeholder:text-green-300 dark:placeholder:text-green-800 text-green-700 dark:text-green-300'
            }`}
            dir="ltr"
          />
          <span className={`text-base font-medium flex-shrink-0 ${
            hasError
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {getCurrencyLabel(currency)}
          </span>
        </div>
      </div>
      {/* Inline error message */}
      {hasError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-right">
          {error}
        </p>
      )}
    </div>
  )
}
