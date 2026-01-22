'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  hasActiveFilter: boolean
  activeFilterLabel: string
  onFilterClick: () => void
}

/**
 * Search and filter bar
 * Minimal UI - doesn't visually dominate the list
 * Clear placeholder for user guidance
 */
export function SearchBar({
  value,
  onChange,
  hasActiveFilter,
  activeFilterLabel,
  onFilterClick,
}: SearchBarProps) {
  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="جستجو تو خرج‌ها..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pr-10 pl-10 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-400 text-sm placeholder:text-gray-400"
          />
          {value && (
            <button
              onClick={() => onChange('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="پاک کردن جستجو"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Button - simple, not advanced looking */}
        <button
          onClick={onFilterClick}
          className={`px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
            hasActiveFilter
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="hidden sm:inline">
            {hasActiveFilter ? activeFilterLabel : 'فیلتر'}
          </span>
        </button>
      </div>
    </div>
  )
}
