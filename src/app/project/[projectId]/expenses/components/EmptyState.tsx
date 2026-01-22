'use client'

interface EmptyStateProps {
  isFiltered: boolean
  onClearFilters: () => void
}

/**
 * Empty state for expenses list
 * Friendly and encouraging, not discouraging
 */
export function EmptyState({ isFiltered, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">{isFiltered ? '🔍' : '✨'}</span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">
        {isFiltered ? 'خرجی پیدا نشد' : 'هنوز خرجی ثبت نشده'}
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
        {isFiltered ? 'فیلتر دیگه‌ای امتحان کنید' : 'اولین خرج رو ثبت کنید'}
      </p>
      {isFiltered && (
        <button
          onClick={onClearFilters}
          className="text-blue-500 text-sm mt-4 font-medium hover:underline"
        >
          پاک کردن فیلترها
        </button>
      )}
    </div>
  )
}
