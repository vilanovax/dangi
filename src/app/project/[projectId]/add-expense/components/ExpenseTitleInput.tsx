'use client'

import { Input } from '@/components/ui'

interface ExpenseTitleInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  helper: string
}

/**
 * عنوان هزینه - Friendly conversational input
 *
 * UX Intent:
 * - Feels like answering a question, not filling a form
 * - "این خرج برای چی بود؟" is conversational
 * - Placeholder shows examples: "شام، بنزین، بلیط..."
 */
export function ExpenseTitleInput({
  value,
  onChange,
  label,
  placeholder,
  helper,
}: ExpenseTitleInputProps) {
  return (
    <div className="bg-white dark:bg-gray-900/80 rounded-2xl p-4 border border-gray-100/80 dark:border-gray-800/50">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        این خرج برای چی بود؟
      </label>
      <input
        type="text"
        placeholder="شام، بنزین، بلیط..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        className="w-full text-lg font-medium bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600"
      />
    </div>
  )
}
