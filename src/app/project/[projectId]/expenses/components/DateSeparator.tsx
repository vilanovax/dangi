'use client'

interface DateSeparatorProps {
  date: string
  /** Makes the date header sticky to top */
  sticky?: boolean
}

/**
 * Date separator between expense groups - Enhanced prominence
 *
 * UX Intent:
 * - More prominent than before but still calm
 * - Optional sticky positioning for better navigation
 * - Pill-style badge for modern feel
 * - Uses building design tokens for consistency
 */
export function DateSeparator({ date, sticky = false }: DateSeparatorProps) {
  return (
    <div
      className={`py-3 ${sticky ? 'sticky top-[120px] z-[5]' : ''}`}
      style={{
        backgroundColor: sticky ? 'var(--building-surface-muted)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--building-border)' }} />
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--building-surface)',
            color: 'var(--building-text-primary)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--building-border)',
          }}
        >
          {date}
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--building-border)' }} />
      </div>
    </div>
  )
}
