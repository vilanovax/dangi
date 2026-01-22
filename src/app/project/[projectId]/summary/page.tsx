'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'
import {
  SummaryHeader,
  MemberBalanceCard,
  SettlementSuggestionCard,
  QuickSettleSheet,
} from './components'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface ParticipantBalance {
  participantId: string
  participantName: string
  totalPaid: number
  totalShare: number
  balance: number
}

interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

interface ProjectSummary {
  projectId: string
  projectName: string
  totalExpenses: number
  currency: string
  participantBalances: ParticipantBalance[]
  settlements: Settlement[]
}

interface Project {
  id: string
  participants: Participant[]
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // ── Data State ──────────────────────────────────────────────
  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Quick Settlement State ──────────────────────────────────
  const [showQuickSettle, setShowQuickSettle] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Fetch Data ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, projectRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/summary`),
        fetch(`/api/projects/${projectId}`),
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary)
      }

      if (projectRes.ok) {
        const data = await projectRes.json()
        setProject(data.project)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Handlers ────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleQuickSettle = useCallback((settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setShowQuickSettle(true)
  }, [])

  const handleCloseQuickSettle = useCallback(() => {
    setShowQuickSettle(false)
    setSelectedSettlement(null)
  }, [])

  const confirmQuickSettle = useCallback(async () => {
    if (!selectedSettlement) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: selectedSettlement.fromId,
          toId: selectedSettlement.toId,
          amount: selectedSettlement.amount,
          note: 'تسویه سریع از صفحه خلاصه',
        }),
      })

      if (res.ok) {
        handleCloseQuickSettle()
        fetchData()
      }
    } catch (error) {
      console.error('Error creating settlement:', error)
    } finally {
      setSubmitting(false)
    }
  }, [selectedSettlement, projectId, handleCloseQuickSettle, fetchData])

  // ── Helper: Get Participant Avatar ──────────────────────────

  const getParticipantAvatar = useCallback(
    (participantId: string) => {
      const participant = project?.participants.find((p) => p.id === participantId)
      if (participant) {
        return deserializeAvatar(participant.avatar || null, participant.name)
      }
      return null
    },
    [project]
  )

  // ── Loading State ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────

  if (!summary) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400">خطا در بارگذاری</p>
        <button onClick={handleBack} className="mt-4 px-4 py-2 text-blue-500 hover:underline">
          بازگشت
        </button>
      </div>
    )
  }

  // ── Computed Values ─────────────────────────────────────────

  const hasDebt = summary.settlements.length > 0
  const hasExpenses = summary.totalExpenses > 0

  // Sort balances: creditors first, then debtors, then settled
  const sortedBalances = [...summary.participantBalances].sort((a, b) => {
    if (a.balance > 0 && b.balance <= 0) return -1
    if (a.balance <= 0 && b.balance > 0) return 1
    if (a.balance < 0 && b.balance >= 0) return 1
    if (a.balance >= 0 && b.balance < 0) return -1
    return b.balance - a.balance
  })

  // ── Main Render ─────────────────────────────────────────────

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-8">
      {/* Header */}
      <SummaryHeader
        projectName={summary.projectName}
        projectId={projectId}
        totalExpenses={summary.totalExpenses}
        participantCount={summary.participantBalances.length}
        currency={summary.currency}
        onBack={handleBack}
      />

      <div className="px-4 py-5 space-y-6">
        {/* Member Balances */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">وضعیت اعضا</h2>
          <div className="space-y-2">
            {sortedBalances.map((p) => (
              <MemberBalanceCard
                key={p.participantId}
                name={p.participantName}
                avatar={getParticipantAvatar(p.participantId)}
                totalPaid={p.totalPaid}
                totalShare={p.totalShare}
                balance={p.balance}
                currency={summary.currency}
              />
            ))}
          </div>
        </section>

        {/* Settlement Suggestions */}
        {hasDebt && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">پیشنهاد تسویه</h2>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">
                {summary.settlements.length} تراکنش
              </span>
            </div>
            <div className="space-y-2">
              {summary.settlements.map((s, index) => (
                <SettlementSuggestionCard
                  key={index}
                  fromName={s.fromName}
                  fromAvatar={getParticipantAvatar(s.fromId)}
                  toName={s.toName}
                  toAvatar={getParticipantAvatar(s.toId)}
                  amount={s.amount}
                  currency={summary.currency}
                  onSettle={() => handleQuickSettle(s)}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              با انجام این تراکنش‌ها همه تسویه می‌شوند
            </p>
          </section>
        )}

        {/* All Settled State */}
        {!hasDebt && hasExpenses && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-green-600 dark:text-green-400 font-bold text-lg">
              همه تسویه هستند!
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              هیچ بدهی باقی نمانده
            </p>
          </div>
        )}

        {/* No Expenses State */}
        {!hasExpenses && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-semibold">
              هنوز خرجی ثبت نشده
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              اولین خرج رو ثبت کنید
            </p>
            <Button
              onClick={() => router.push(`/project/${projectId}/add-expense`)}
              className="mt-4"
            >
              ثبت اولین خرج
            </Button>
          </div>
        )}
      </div>

      {/* Quick Settlement Confirmation Sheet */}
      <QuickSettleSheet
        isOpen={showQuickSettle}
        onClose={handleCloseQuickSettle}
        onConfirm={confirmQuickSettle}
        settlement={selectedSettlement}
        fromAvatar={selectedSettlement ? getParticipantAvatar(selectedSettlement.fromId) : null}
        toAvatar={selectedSettlement ? getParticipantAvatar(selectedSettlement.toId) : null}
        currency={summary.currency}
        submitting={submitting}
      />
    </main>
  )
}
