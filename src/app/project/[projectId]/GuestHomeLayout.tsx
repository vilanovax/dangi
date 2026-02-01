'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import Link from 'next/link'
import type { Project, Summary, AccessScope } from '@/types'
import { canCreate } from '@/lib/utils/permissions'
import { formatMoney } from '@/lib/utils/money'
import { AccessBadge } from '@/components/ui'

interface GuestHomeLayoutProps {
  scopes: AccessScope[]
}

/**
 * Guest Home Layout
 * Limited view for users accessing via access links
 * Shows only: expenses, optional summary, access badge
 * Hides: settings, settlements, member management, CTAs
 */
export default function GuestHomeLayout({ scopes }: GuestHomeLayoutProps) {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // ── Data State ──────────────────────────────────────────────
  const [project, setProject] = useState<Project | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Fetch Data ──────────────────────────────────────────────

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/summary`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch {
      // Silently fail for summary
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
    fetchSummary()
  }, [fetchProject, fetchSummary])

  // ── Computed Values ─────────────────────────────────────────

  const totalExpenses = project?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0

  // Determine access type from scopes
  const isReadOnly = !canCreate(scopes, 'expenses')
  const isContributor = canCreate(scopes, 'expenses')

  // ── Loading State ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────

  if (error || !project) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-950">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'پروژه یافت نشد'}</p>
        <Button onClick={() => router.push('/')}>بازگشت به خانه</Button>
      </div>
    )
  }

  // ── Main Render ─────────────────────────────────────────────

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header with Access Badge */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="px-4 py-4">
          {/* Project Name */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {project.name}
          </h1>

          {/* Access Badge */}
          <div className="flex items-center gap-2">
            <AccessBadge type={isReadOnly ? 'viewer' : 'contributor'} size="sm" />
          </div>
        </div>

        {/* Access Limitation Banner */}
        <div className="px-4 pb-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {isReadOnly
                ? '👁️ دسترسی شما: فقط مشاهده'
                : '✏️ دسترسی شما: مشاهده و افزودن خرج'
              }
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Total Expenses Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              مجموع هزینه‌ها
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatMoney(totalExpenses, project.currency)}
            </p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              لیست خرج‌ها
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {project.expenses.length} مورد
            </span>
          </div>

          {project.expenses.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl mb-2 block">💸</span>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                هنوز خرجی ثبت نشده
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {project.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => {
                  const payer = project.participants.find(p => p.id === expense.payerId)
                  return (
                    <div key={expense.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {expense.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            پرداخت: {payer?.name}
                          </p>
                          {expense.category && (
                            <span className="inline-block text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded mt-1">
                              {expense.category.icon} {expense.category.name}
                            </span>
                          )}
                        </div>
                        <div className="text-left flex-shrink-0">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatMoney(expense.amount, project.currency)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {new Date(expense.date).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Optional: Simplified Summary */}
        {summary && summary.participantBalances.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                خلاصه حساب
              </h2>
            </div>
            <div className="p-4 space-y-2">
              {summary.participantBalances.map((balance) => {
                const participant = project.participants.find(p => p.id === balance.participantId)
                if (!participant) return null

                return (
                  <div key={balance.participantId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {participant.name}
                    </span>
                    <span className={`font-medium ${
                      balance.balance > 0
                        ? 'text-green-600 dark:text-green-400'
                        : balance.balance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {balance.balance > 0 ? '+' : ''}
                      {formatMoney(balance.balance, project.currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Participants List (Minimal) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              اعضای پروژه
            </h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {project.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {participant.name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {participant.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Hint - Request Full Access */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            💡 برای دسترسی کامل و مدیریت پروژه، از مدیر پروژه درخواست عضویت کنید
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            دسترسی از طریق لینک اشتراک • بدون نیاز به ثبت‌نام
          </p>
        </div>
      </div>

      {/* Floating Add Expense Button (only for contributors) */}
      {isContributor && (
        <Link href={`/project/${projectId}/expenses/new`}>
          <button className="fixed left-4 bottom-20 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </Link>
      )}
    </main>
  )
}
