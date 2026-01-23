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
 * ورودی مبلغ - Hero Input
 *
 * UX Intent:
 * - Biggest, boldest element on the form
 * - Feels like typing into a calculator
 * - Currency softly displayed, not dominant
 * - Share preview is secondary and friendly
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
    <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-3xl p-6 text-center border border-blue-100/50 dark:border-blue-900/30">
      {/* Friendly label */}
      <label className="block text-sm text-blue-600/70 dark:text-blue-400/70 mb-3 font-medium">
        چقدر شد؟ 💰
      </label>

      {/* Hero amount input */}
      <div className="flex items-baseline justify-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="۰"
          value={value}
          onChange={(e) => onChange(formatInputAmount(e.target.value))}
          className="text-5xl font-bold text-center w-full bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-700"
        />
        <span className="text-lg text-gray-400 dark:text-gray-500 font-medium flex-shrink-0">
          {getCurrencyLabel(currency)}
        </span>
      </div>

      {/* Share preview - friendly and secondary */}
      {sharePerPerson !== null && participantCount > 0 && (
        <div className="mt-4 pt-3 border-t border-blue-100/50 dark:border-blue-900/30">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            سهم هر {participantTerm}:{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{formatMoney(sharePerPerson, currency)}</span>
          </p>
        </div>
      )}
    </div>
  )
}
