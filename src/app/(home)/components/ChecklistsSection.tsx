/**
 * Checklists Section
 * Displays recent checklists on the home page
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import type { Checklist } from '@/types/checklist'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChecklistsResponse {
  checklists: Checklist[]
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getProgressPercentage(checklist: Checklist): number {
  if (checklist.items.length === 0) return 0
  const checked = checklist.items.filter((i) => i.isChecked).length
  return Math.round((checked / checklist.items.length) * 100)
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ChecklistsSection() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Fetch Recent Checklists ─────────────────────────────────
  useEffect(() => {
    async function fetchChecklists() {
      try {
        const res = await fetch('/api/checklists?includeArchived=false')
        if (!res.ok) {
          // If not authenticated or error, just don't show section
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

  // ── Don't show if loading or no user (handled by API error) ─
  if (isLoading) {
    return null // Or could show skeleton
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
          <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
            ✅ چک‌لیست‌ها
          </h2>
          {checklists.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
              {checklists.length}
            </span>
          )}
        </div>
        {checklists.length > 0 && (
          <Link
            href="/checklists"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            مشاهده همه
          </Link>
        )}
      </div>

      {/* Content */}
      {checklists.length === 0 ? (
        // Empty State
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            چک‌لیست برای مدیریت کارها و خریدهای خود بسازید
          </p>
          <Link href="/checklists/new">
            <Button
              size="sm"
              className="!bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700"
            >
              ایجاد اولین چک‌لیست
            </Button>
          </Link>
        </div>
      ) : (
        // Checklists List
        <div className="space-y-3">
          {checklists.map((checklist) => {
            const progress = getProgressPercentage(checklist)
            return (
              <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-white/50 dark:border-gray-700/50 hover:scale-[1.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${checklist.color}20` }}
                    >
                      {checklist.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {checklist.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {checklist.items.length} مورد
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {progress}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">پیشرفت</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Create New Button */}
          <Link href="/checklists/new">
            <button className="w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 text-center hover:shadow-md transition-all border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
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
