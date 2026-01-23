'use client'

interface DateSeparatorProps {
  date: string
}

/**
 * Date separator between expense groups
 *
 * UX Intent:
 * - Acts as soft anchor, not strong header
 * - More visible but not competing with items
 * - Increased spacing for better rhythm
 */
export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-2 mt-1">
      <div className="h-px flex-1 bg-gray-200/80 dark:bg-gray-800/80" />
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
        {date}
      </span>
      <div className="h-px flex-1 bg-gray-200/80 dark:bg-gray-800/80" />
    </div>
  )
}
