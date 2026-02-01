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
 * Dedicated limited view for users accessing via access links
 *
 * Design Philosophy:
 * - NOT the same as member home with hidden buttons
 * - Clear access badge and limitations
 * - Focused on viewing expenses and simple summary
 * - Soft conversion to request membership
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
  const [activeTab, setActiveTab] = useState<'expenses' | 'participants' | 'summary'>('expenses')

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
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-32">
      {/* ╔═══════════════════════════════════════════╗ */}
      {/* ║  Header — Sticky با Access Badge          ║ */}
      {/* ╚═══════════════════════════════════════════╝ */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          {/* Access Badge (Primary Indicator) */}
          <div className="flex items-center gap-2 mb-2">
            <AccessBadge type={isReadOnly ? 'viewer' : 'contributor'} size="md" />
          </div>

          {/* Project Name */}
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>

          {/* Access Limitation Hint */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isReadOnly
              ? 'این لینک فقط برای مشاهده اطلاعات است'
              : 'می‌تونی خرج اضافه کنی'
            }
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* ╔═══════════════════════════════════════════╗ */}
        {/* ║  Card 1 — مجموع خرج‌ها (Simple Summary)   ║ */}
        {/* ╚═══════════════════════════════════════════╝ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              مجموع خرج‌ها
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatMoney(totalExpenses, project.currency)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              تعداد خرج‌ها: {project.expenses.length} • تعداد همسفرها: {project.participants.length}
            </p>
          </div>
        </div>

        {/* ╔═══════════════════════════════════════════╗ */}
        {/* ║  Tabs Navigation                           ║ */}
        {/* ╚═══════════════════════════════════════════╝ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              هزینه‌ها
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'participants'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              همسفرها
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              خلاصه
            </button>
          </div>

          {/* ╔═══════════════════════════════════════════╗ */}
          {/* ║  Tab Content — Expenses                    ║ */}
          {/* ╚═══════════════════════════════════════════╝ */}
          {activeTab === 'expenses' && (
            <div>
              {/* Contributor CTA (if applicable) */}
              {isContributor && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        می‌تونی خرج ثبت کنی
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        به‌عنوان مهمان
                      </p>
                    </div>
                    <Link href={`/project/${projectId}/expenses/new`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        + ثبت خرج
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Expenses List */}
              {project.expenses.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-5xl mb-3 block">💸</span>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    هنوز هزینه‌ای ثبت نشده
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {project.expenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((expense) => {
                      const payer = project.participants.find(p => p.id === expense.payerId)
                      return (
                        <div key={expense.id} className="p-4 cursor-default">
                          <div className="flex items-start gap-3">
                            {/* Category Icon */}
                            {expense.category && (
                              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xl">
                                {expense.category.icon}
                              </div>
                            )}

                            {/* Expense Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {expense.description}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    پرداخت: {payer?.name} • {new Date(expense.date).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })}
                                  </p>
                                </div>

                                {/* Amount */}
                                <div className="text-left flex-shrink-0">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {formatMoney(expense.amount, project.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* ╔═══════════════════════════════════════════╗ */}
          {/* ║  Tab Content — Participants                ║ */}
          {/* ╚═══════════════════════════════════════════╝ */}
          {activeTab === 'participants' && (
            <div className="p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">
                فقط اسامی همسفرها نمایش داده می‌شود
              </p>
              <div className="flex flex-wrap gap-2">
                {project.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full cursor-default"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {participant.name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {participant.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ╔═══════════════════════════════════════════╗ */}
          {/* ║  Tab Content — Summary                     ║ */}
          {/* ╚═══════════════════════════════════════════╝ */}
          {activeTab === 'summary' && (
            <div className="p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">
                این فقط نمای کلی هزینه‌های سفر است
              </p>

              {/* Total Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    مجموع کل
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatMoney(totalExpenses, project.currency)}
                  </p>
                </div>
              </div>

              {/* Balance Hints (if available) */}
              {summary?.participantBalances && summary.participantBalances.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    وضعیت تسویه (ساده‌شده)
                  </p>
                  <div className="space-y-1.5 mb-3">
                    {summary.participantBalances
                      .filter(b => Math.abs(b.balance) > 1)
                      .slice(0, 3)
                      .map((balance) => {
                        const participant = project.participants.find(p => p.id === balance.participantId)
                        if (!participant) return null

                        return (
                          <div key={balance.participantId} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700 dark:text-gray-300">
                              • {participant.name}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {balance.balance > 0 ? 'طلبکار' : 'بدهکار'}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    💡 برای مشاهده جزئیات کامل، عضو پروژه شو
                  </p>
                </div>
              )}

              {(!summary?.participantBalances || summary.participantBalances.length === 0) && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                  هنوز اطلاعات تسویه موجود نیست
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ╔═══════════════════════════════════════════╗ */}
      {/* ║  Footer — درخواست عضویت (Soft CTA)        ║ */}
      {/* ╚═══════════════════════════════════════════╝ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              می‌خوای تو خرج‌ها شریک باشی؟
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              برای ثبت خرج یا تسویه، باید عضو پروژه باشید
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              درخواست عضویت
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
