'use client'

interface EmptyStateProps {
  isFiltered: boolean
  onClearFilters: () => void
}

/**
 * Empty state for expenses list - Final Polish
 * Friendly and encouraging, not discouraging
 * Uses building design tokens
 */
export function EmptyState({ isFiltered, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: 'var(--building-surface-muted)' }}
      >
        <span className="text-4xl">{isFiltered ? '🔍' : '✨'}</span>
      </div>
      <p className="font-medium" style={{ color: 'var(--building-text-primary)' }}>
        {isFiltered ? 'خرجی پیدا نشد' : 'هنوز خرجی ثبت نشده'}
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--building-text-secondary)' }}>
        {isFiltered ? 'فیلتر دیگه‌ای امتحان کنید' : 'اولین خرج رو ثبت کنید'}
      </p>
      {isFiltered && (
        <button
          onClick={onClearFilters}
          className="text-sm mt-4 font-medium hover:underline"
          style={{ color: 'var(--building-primary)' }}
        >
          پاک کردن فیلترها
        </button>
      )}
    </div>
  )
}
