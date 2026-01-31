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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
          <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300">
            چک‌لیست‌ها
          </h2>
          {checklists.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
              {checklists.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {checklists.length > 0 && (
            <Link
              href="/checklists"
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              مشاهده همه
            </Link>
          )}
          <Link href="/checklists/new">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors shadow-sm hover:shadow-md">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              جدید
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {checklists.length === 0 ? (
        // Empty State - Compact
        <Link href="/checklists/new">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 flex items-center justify-center transition-colors">
              <svg className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              چک‌لیستی نداری؟ یکی بساز
            </p>
          </div>
        </Link>
      ) : compact ? (
        // Compact Mode - 2 Column Grid
        <div className="grid grid-cols-2 gap-3">
          {checklists.slice(0, 4).map((checklist) => {
            const progress = getProgressPercentage(checklist)
            const items = checklist.items || []
            return (
              <Link
                key={checklist.id}
                href={`/checklists/${checklist.id}`}
              >
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02] active:scale-[0.98]">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                      <span className="text-lg">{checklist.icon || '📋'}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
                      {checklist.title}
                    </h3>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {items.filter((i) => i.isChecked).length}/{items.length} مورد
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        // Regular Mode - 2 Column Grid
        <div className="grid grid-cols-2 gap-3">
          {checklists.map((checklist) => {
            const progress = getProgressPercentage(checklist)
            const items = checklist.items || []
            return (
              <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02] active:scale-[0.98]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                      <span className="text-xl">{checklist.icon || '📋'}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
                      {checklist.title}
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {items.filter((i) => i.isChecked).length}/{items.length} مورد
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
