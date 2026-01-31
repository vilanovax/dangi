'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  hasActiveFilter: boolean
  activeFilterLabel: string
  onFilterClick: () => void
}

/**
 * Search and filter bar - Final Polish
 *
 * UX Intent:
 * - Minimal UI that doesn't dominate the list
 * - Casual placeholder feels friendly
 * - Uses building design tokens for consistency
 */
export function SearchBar({
  value,
  onChange,
  hasActiveFilter,
  activeFilterLabel,
  onFilterClick,
}: SearchBarProps) {
  return (
    <div
      className="px-4 py-3"
      style={{
        backgroundColor: 'var(--building-surface)',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--building-border-muted)',
      }}
    >
      <div className="flex gap-2">
        {/* Search Input - casual placeholder */}
        <div className="flex-1 relative">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--building-text-muted)' }}
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
            placeholder="تو خرج‌ها بگرد…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pr-9 pl-9 py-2.5 rounded-xl outline-none text-sm transition-all"
            style={{
              backgroundColor: 'var(--building-surface-muted)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-border)',
              color: 'var(--building-text-primary)',
            }}
          />
          {value && (
            <button
              onClick={() => onChange('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors active:scale-95"
              style={{ color: 'var(--building-text-muted)' }}
              aria-label="پاک کردن جستجو"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Button - uses building tokens */}
        <button
          onClick={onFilterClick}
          className="px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all active:scale-95"
          style={{
            backgroundColor: hasActiveFilter ? 'var(--building-primary)' : 'var(--building-surface-muted)',
            color: hasActiveFilter ? 'white' : 'var(--building-text-secondary)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: hasActiveFilter ? 'var(--building-primary)' : 'var(--building-border)',
          }}
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
