'use client'

interface DateSeparatorProps {
  date: string
}

/**
 * Date separator between expense groups
 * Calm and readable - doesn't compete with items
 */
export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium px-1">
        {date}
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
    </div>
  )
}
