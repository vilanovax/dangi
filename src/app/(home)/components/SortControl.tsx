'use client'

export type SortOption = 'newest' | 'active' | 'unsettled'

interface SortControlProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

/**
 * Sort control for project list
 *
 * UX Intent:
 * - Horizontal pill-style options
 * - Clear visual feedback for selected option
 * - Compact design
 */
export function SortControl({ value, onChange }: SortControlProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'جدیدترین' },
    { value: 'active', label: 'فعال‌ها' },
    { value: 'unsettled', label: 'تسویه‌نشده‌ها' },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">مرتب‌سازی:</span>
      <div className="flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl p-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              value === option.value
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
