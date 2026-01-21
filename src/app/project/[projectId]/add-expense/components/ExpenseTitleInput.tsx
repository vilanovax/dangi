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
 * عنوان هزینه - اولین و مهم‌ترین فیلد
 * باید برجسته و واضح باشد
 */
export function ExpenseTitleInput({
  value,
  onChange,
  label,
  placeholder,
  helper,
}: ExpenseTitleInputProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        className="text-lg font-medium"
      />
      <p className="text-xs text-gray-400 mt-2">{helper}</p>
    </div>
  )
}
