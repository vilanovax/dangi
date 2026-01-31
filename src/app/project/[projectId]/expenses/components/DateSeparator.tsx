'use client'

interface DateSeparatorProps {
  date: string
}

/**
 * Date separator between expense groups - Final Polish
 *
 * UX Intent:
 * - Acts as soft anchor, not strong header
 * - More visible but not competing with items
 * - Uses building design tokens for consistency
 */
export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-2 mt-1">
      <div className="h-px flex-1" style={{ backgroundColor: 'var(--building-border)' }} />
      <span className="text-xs font-medium px-2" style={{ color: 'var(--building-text-secondary)' }}>
        {date}
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: 'var(--building-border)' }} />
    </div>
  )
}
