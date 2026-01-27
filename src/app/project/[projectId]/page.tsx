'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button, FloatingButton } from '@/components/ui'
import Link from 'next/link'
import type { Participant, Project, Settlement, Summary } from '@/types'
import {
  DashboardHeader,
  HangoutHeader,
  QuickActions,
  ParticipantsRow,
  RecentExpenseCard,
  RecentSettlementCard,
  ShoppingChecklistTab,
  PersonalSplitDashboard,
  PersonalTrackingDashboard,
} from './components'

// Lazy load heavy bottom sheets (only when opened)
const AddMemberSheet = dynamic(() => import('./components/AddMemberSheet').then(mod => ({ default: mod.AddMemberSheet })), {
  ssr: false,
})
const ParticipantProfileSheet = dynamic(() => import('./components/ParticipantProfileSheet').then(mod => ({ default: mod.ParticipantProfileSheet })), {
  ssr: false,
})
const TransferBalanceSheet = dynamic(() => import('./components/TransferBalanceSheet').then(mod => ({ default: mod.TransferBalanceSheet })), {
  ssr: false,
})

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // ── Data State ──────────────────────────────────────────────
  const [project, setProject] = useState<Project | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Modal State ─────────────────────────────────────────────
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const [showTransferSheet, setShowTransferSheet] = useState(false)

  // ── Tab State (for gathering template) ─────────────────────
  const [activeTab, setActiveTab] = useState<'expenses' | 'shopping'>('expenses')

  // ── Fetch Data ──────────────────────────────────────────────

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('پروژه یافت نشد')

      const data = await res.json()
      setProject(data.project)
      setMyParticipantId(data.myParticipantId || null)
    } catch {
      setError('خطا در بارگذاری پروژه')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const fetchSettlements = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/settlements`)
      if (res.ok) {
        const data = await res.json()
        setSettlements(data.settlements)
      }
    } catch {
      // Silently fail for settlements
    }
  }, [projectId])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/summary`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
      }
    } catch {
      // Silently fail for summary
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
    fetchSettlements()
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Redirect family template to family dashboard
  useEffect(() => {
    if (project && project.template === 'family') {
      router.push(`/project/${projectId}/family`)
    }
  }, [project, projectId, router])

  // ── Participant Handlers ──────────────────────────────────────

  const handleParticipantClick = useCallback((participant: Participant) => {
    setSelectedParticipant(participant)
    setShowProfileSheet(true)
  }, [])

  const handleEditParticipant = useCallback(() => {
    setShowProfileSheet(false)
    // Navigate to participants page for editing
    router.push(`/project/${projectId}/participants`)
  }, [router, projectId])

  const handleDeleteParticipant = useCallback(() => {
    setShowProfileSheet(false)
    // Navigate to participants page for deletion
    router.push(`/project/${projectId}/participants`)
  }, [router, projectId])

  const handleTransferBalance = useCallback(() => {
    setShowProfileSheet(false)
    setShowTransferSheet(true)
  }, [])

  const handleRefreshData = useCallback(() => {
    fetchProject()
    fetchSettlements()
    fetchSummary()
    setSelectedParticipant(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get balance for selected participant
  const getSelectedBalance = useCallback(() => {
    if (!selectedParticipant || !summary) return null
    return summary.participantBalances.find(
      (b) => b.participantId === selectedParticipant.id
    ) || null
  }, [selectedParticipant, summary])

  // Get settlement count for selected participant
  const getSettlementCount = useCallback(() => {
    if (!selectedParticipant) return 0
    return settlements.filter(
      (s) => s.from.id === selectedParticipant.id || s.to.id === selectedParticipant.id
    ).length
  }, [selectedParticipant, settlements])

  // Redirect to building dashboard for building template
  useEffect(() => {
    if (project?.template === 'building') {
      router.replace(`/project/${projectId}/building`)
    }
  }, [project?.template, projectId, router])

  // ── Computed Values ─────────────────────────────────────────

  const totalExpenses = project?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0

  // Check if all balances are settled (all balances near zero)
  const isAllSettled = summary?.participantBalances.every(
    (b) => Math.abs(b.balance) < 1
  ) ?? false

  // ── Loading State ───────────────────────────────────────────
  // For building template, show emerald loading to prevent flash
  const isBuilding = project?.template === 'building'

  if (loading || isBuilding) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className={`animate-spin w-8 h-8 border-2 ${isBuilding ? 'border-emerald-500' : 'border-blue-500'} border-t-transparent rounded-full`} />
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
      {/* Header - Different for gathering template */}
      {project.template === 'gathering' ? (
        <HangoutHeader
          projectId={projectId}
          projectName={project.name}
          participantCount={project.participants.length}
          totalExpenses={totalExpenses}
          currency={project.currency}
        />
      ) : (
        <DashboardHeader
          projectId={projectId}
          projectName={project.name}
          participantCount={project.participants.length}
          totalExpenses={totalExpenses}
          currency={project.currency}
        />
      )}

      {/* Quick Actions - Different for personal template */}
      {project.template === 'personal' ? (
        // Personal Template Dashboard (Dual-Mode)
        project.trackingOnly ? (
          <PersonalTrackingDashboard
            projectId={projectId}
            summary={summary}
            participants={project.participants}
            expenses={project.expenses}
            currency={project.currency}
            totalExpenses={totalExpenses}
          />
        ) : (
          <PersonalSplitDashboard
            projectId={projectId}
            summary={summary}
            participants={project.participants}
            currency={project.currency}
          />
        )
      ) : (
        <QuickActions projectId={projectId} template={project.template} isSettled={isAllSettled} />
      )}

      {/* Participants */}
      <ParticipantsRow
        participants={project.participants}
        onAddMember={() => setShowAddMember(true)}
        onParticipantClick={handleParticipantClick}
      />

      {/* ─── Tabs (only for gathering template) ─────────────────── */}
      {project.template === 'gathering' && (
        <div className="px-4 mt-6">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              💰 خرج‌ها
            </button>
            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'shopping'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🛒 لیست خرید
            </button>
          </div>
        </div>
      )}

      {/* ─── Shopping Checklist Tab ─────────────────────────────── */}
      {project.template === 'gathering' && activeTab === 'shopping' && (
        <section className="px-4 mt-6">
          <ShoppingChecklistTab
            projectId={projectId}
            currentParticipantId={myParticipantId || undefined}
          />
        </section>
      )}

      {/* ─── Recent Expenses Section ─────────────────────────────── */}
      {(project.template !== 'gathering' || activeTab === 'expenses') && (
      <section className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            هزینه‌های اخیر
          </h2>
          {project.expenses.length > 0 && (
            <Link
              href={`/project/${projectId}/expenses`}
              className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
            >
              همه →
            </Link>
          )}
        </div>

        {project.expenses.length === 0 ? (
          /* Empty state - friendly, encouraging */
          <div className="bg-white dark:bg-gray-900/80 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800/50">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">هنوز خرجی ثبت نشده</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              اولیش با تو 😉
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {project.expenses.slice(0, 4).map((expense) => (
              <RecentExpenseCard
                key={expense.id}
                id={expense.id}
                projectId={projectId}
                title={expense.title}
                amount={expense.amount}
                currency={project.currency}
                paidBy={expense.paidBy}
                category={expense.category}
                expenseDate={expense.expenseDate}
              />
            ))}
          </div>
        )}
      </section>
      )}

      {/* ─── Recent Settlements Section ───────────────────────────── */}
      {(project.template !== 'gathering' || activeTab === 'expenses') &&
       !(project.template === 'personal' && project.trackingOnly) &&
       settlements.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              تسویه‌های اخیر
            </h2>
            <Link
              href={`/project/${projectId}/settlements`}
              className="text-sm text-green-500 hover:text-green-600 transition-colors"
            >
              همه →
            </Link>
          </div>
          <div className="space-y-2.5">
            {settlements.slice(0, 3).map((settlement) => (
              <RecentSettlementCard
                key={settlement.id}
                id={settlement.id}
                projectId={projectId}
                from={settlement.from}
                to={settlement.to}
                amount={settlement.amount}
                currency={project.currency}
                settledAt={settlement.settledAt}
              />
            ))}
          </div>
        </section>
      )}

      {/* Floating Add Button - Primary CTA */}
      {(project.template !== 'gathering' || activeTab === 'expenses') && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 safe-bottom flex flex-col items-center gap-1.5">
        {/* Hint text - only show when few expenses to encourage first action */}
        {project.expenses.length < 3 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
            سریع و راحت ⚡
          </span>
        )}
        <FloatingButton
          onClick={() => router.push(`/project/${projectId}/add-expense`)}
          className="!static !translate-x-0"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          ثبت هزینه
        </FloatingButton>
      </div>
      )}

      {/* Add Member Bottom Sheet */}
      <AddMemberSheet
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        projectId={projectId}
        shareCode={project.shareCode}
        onMemberAdded={fetchProject}
      />

      {/* Participant Profile Sheet */}
      <ParticipantProfileSheet
        isOpen={showProfileSheet}
        onClose={() => {
          setShowProfileSheet(false)
          setSelectedParticipant(null)
        }}
        participant={selectedParticipant}
        balance={getSelectedBalance()}
        currency={project.currency}
        settlementCount={getSettlementCount()}
        projectId={projectId}
        myParticipantId={myParticipantId}
        onEdit={handleEditParticipant}
        onDelete={handleDeleteParticipant}
        onTransferBalance={handleTransferBalance}
      />

      {/* Transfer Balance Sheet */}
      <TransferBalanceSheet
        isOpen={showTransferSheet}
        onClose={() => {
          setShowTransferSheet(false)
          setSelectedParticipant(null)
        }}
        participant={selectedParticipant}
        participants={project.participants}
        balance={getSelectedBalance()?.balance || 0}
        currency={project.currency}
        projectId={projectId}
        onSuccess={handleRefreshData}
      />
    </main>
  )
}
