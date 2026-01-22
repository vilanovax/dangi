'use client'

import { formatInputAmount, getCurrencyLabel } from '@/lib/utils/money'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency: string
}

/**
 * Large, prominent amount input for settlements
 * Clean design with currency label
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            placeholder="۰"
            className="flex-1 text-3xl font-bold text-center bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            dir="ltr"
          />
          <span className="text-sm text-gray-400 font-medium flex-shrink-0">
            {getCurrencyLabel(currency)}
          </span>
        </div>
      </div>
    </div>
  )
}
