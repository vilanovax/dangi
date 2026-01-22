'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, FloatingButton, Card } from '@/components/ui'
import Link from 'next/link'
import {
  DashboardHeader,
  QuickActions,
  ParticipantsRow,
  RecentExpenseCard,
  RecentSettlementCard,
  AddMemberSheet,
} from './components'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  role: string
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  title: string
  amount: number
  expenseDate: string
  paidBy: Participant
  category?: Category
}

interface Settlement {
  id: string
  amount: number
  note?: string | null
  settledAt: string
  from: Participant
  to: Participant
}

interface Project {
  id: string
  name: string
  description: string | null
  template: string
  currency: string
  shareCode: string
  participants: Participant[]
  expenses: Expense[]
  categories: Category[]
}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Modal State ─────────────────────────────────────────────
  const [showAddMember, setShowAddMember] = useState(false)

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

  useEffect(() => {
    fetchProject()
    fetchSettlements()
  }, [fetchProject, fetchSettlements])

  // ── Computed Values ─────────────────────────────────────────

  const totalExpenses = project?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0

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
      {/* Header */}
      <DashboardHeader
        projectId={projectId}
        projectName={project.name}
        participantCount={project.participants.length}
        totalExpenses={totalExpenses}
        currency={project.currency}
      />

      {/* Quick Actions */}
      <QuickActions projectId={projectId} />

      {/* Participants */}
      <ParticipantsRow
        participants={project.participants}
        onAddMember={() => setShowAddMember(true)}
      />

      {/* Recent Expenses */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">هزینه‌های اخیر</h2>
          {project.expenses.length > 0 && (
            <Link href={`/project/${projectId}/expenses`} className="text-sm text-blue-500">
              مشاهده همه
            </Link>
          )}
        </div>

        {project.expenses.length === 0 ? (
          <Card className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">هنوز هزینه‌ای ثبت نشده</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              اولین هزینه را اضافه کنید
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {project.expenses.slice(0, 5).map((expense) => (
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
      </div>

      {/* Recent Settlements */}
      {settlements.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">تسویه‌های اخیر</h2>
            <Link href={`/project/${projectId}/settlements`} className="text-sm text-green-500">
              مشاهده همه
            </Link>
          </div>
          <div className="space-y-2">
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
        </div>
      )}

      {/* Floating Add Button */}
      <FloatingButton
        onClick={() => router.push(`/project/${projectId}/add-expense`)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        ثبت هزینه
      </FloatingButton>

      {/* Add Member Bottom Sheet */}
      <AddMemberSheet
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        projectId={projectId}
        shareCode={project.shareCode}
        onMemberAdded={fetchProject}
      />
    </main>
  )
}
