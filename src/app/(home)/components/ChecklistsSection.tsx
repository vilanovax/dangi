/**
 * Checklists Section
 * Displays recent checklists on the home page
 * Compact mode for secondary visual importance
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Checklist } from '@/types/checklist'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChecklistsResponse {
  checklists: Checklist[]
}

interface ChecklistsSectionProps {
  compact?: boolean
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getProgressPercentage(checklist: Checklist): number {
  const items = checklist.items || []
  if (items.length === 0) return 0
  const checked = items.filter((i) => i.isChecked).length
  return Math.round((checked / items.length) * 100)
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ChecklistsSection({ compact = false }: ChecklistsSectionProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Fetch Recent Checklists ─────────────────────────────────
  useEffect(() => {
    async function fetchChecklists() {
      try {
        const res = await fetch('/api/checklists?includeArchived=false')
        if (!res.ok) {
          setChecklists([])
          return
        }
        const data: ChecklistsResponse = await res.json()
        // Get 3 most recent
        setChecklists(data.checklists.slice(0, 3))
      } catch (error) {
        console.error('Error fetching checklists:', error)
        setChecklists([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchChecklists()
  }, [])

  // ── Don't show if loading ─────────────────────────────────
  if (isLoading) {
    return null
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400">
            چک‌لیست‌ها
          </h2>
          {checklists.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full">
              {checklists.length}
            </span>
          )}
        </div>
        {checklists.length > 0 && (
          <Link
            href="/checklists"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            مشاهده همه
          </Link>
        )}
      </div>

      {/* Content */}
      {checklists.length === 0 ? (
        // Empty State - Compact
        <Link href="/checklists/new">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center border border-dashed border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group">
            <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              چک‌لیستی نداری؟ یکی بساز
            </p>
          </div>
        </Link>
      ) : compact ? (
        // Compact Mode - Horizontal scroll with smaller cards
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {checklists.map((checklist) => {
            const progress = getProgressPercentage(checklist)
            const items = checklist.items || []
            return (
              <Link
                key={checklist.id}
                href={`/checklists/${checklist.id}`}
                className="flex-shrink-0"
              >
                <div className="w-36 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02]">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{checklist.icon || '📋'}</span>
                    <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
                      {checklist.title}
                    </h3>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                      {progress}%
                    </span>
                  </div>

                  {/* Item count */}
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                    {items.filter((i) => i.isChecked).length}/{items.length} انجام شده
                  </p>
                </div>
              </Link>
            )
          })}

          {/* Create New Card */}
          <Link href="/checklists/new" className="flex-shrink-0">
            <div className="w-36 h-full min-h-[88px] bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors flex flex-col items-center justify-center gap-1.5 group">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 flex items-center justify-center transition-colors">
                <svg
                  className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400 group-hover:text-emerald-600 transition-colors">
                جدید
              </span>
            </div>
          </Link>
        </div>
      ) : (
        // Regular Mode - Vertical list
        <div className="space-y-2">
          {checklists.map((checklist) => {
            const progress = getProgressPercentage(checklist)
            const items = checklist.items || []
            return (
              <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.01]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${checklist.color || '#10b981'}15` }}
                    >
                      {checklist.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {checklist.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {items.length} مورد
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Create New Button */}
          <Link href="/checklists/new">
            <button className="w-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 text-center hover:shadow-sm transition-all border border-dashed border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500">
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>ایجاد چک‌لیست جدید</span>
              </div>
            </button>
          </Link>
        </div>
      )}
    </section>
  )
}
