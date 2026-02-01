'use client'

import { useState } from 'react'
import { ChecklistBottomSheet } from './ChecklistBottomSheet'
import type { TravelChecklistItem } from '@/types/checklist'

interface ChecklistCardProps {
  projectId: string
  items: TravelChecklistItem[]
  onUpdate: () => void
}

/**
 * Home screen checklist preview card
 *
 * UX Principles:
 * - Show max 3 active items for quick scan
 * - Counter badge draws attention to pending tasks
 * - Tap opens full checklist sheet
 */
export function ChecklistCard({ projectId, items, onUpdate }: ChecklistCardProps) {
  const [showSheet, setShowSheet] = useState(false)

  // Filter active (unchecked) items
  const activeItems = items.filter((item) => item.status === 'active')
  const activeCount = activeItems.length

  // Show first 3 active items
  const previewItems = activeItems.slice(0, 3)
  const hasMore = activeItems.length > 3

  // Empty state
  if (activeCount === 0) {
    return (
      <>
        <button
          onClick={() => setShowSheet(true)}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-right"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              📝 کارهای سفر
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            کاری برای انجام نیست 👌
          </p>
        </button>

        <ChecklistBottomSheet
          isOpen={showSheet}
          onClose={() => setShowSheet(false)}
          projectId={projectId}
          items={items}
          onUpdate={onUpdate}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowSheet(true)}
        className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-right"
      >
        {/* Header with counter badge */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            📝 کارهای سفر
          </h3>
          {activeCount > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {activeCount}
            </span>
          )}
        </div>

        {/* Preview items (max 3) */}
        <div className="space-y-2">
          {previewItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="text-gray-400 mt-0.5">•</span>
              <span className="flex-1 line-clamp-1">{item.text}</span>
            </div>
          ))}
        </div>

        {/* "See all" link if more items exist */}
        {hasMore && (
          <p className="text-sm text-blue-500 mt-3 font-medium">
            دیدن همه ({activeCount})
          </p>
        )}
      </button>

      <ChecklistBottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        projectId={projectId}
        items={items}
        onUpdate={onUpdate}
      />
    </>
  )
}
