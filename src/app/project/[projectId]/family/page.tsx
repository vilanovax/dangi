/**
 * Family Finance Dashboard
 * Card-stack layout with 6 full-height cards
 */

'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectKeys } from '@/hooks/useProjects'
import type { FamilyDashboardStats } from '@/types/family'

// Import dashboard cards (to be created)
import { MonthlyOverviewCard } from './components/MonthlyOverviewCard'
import { QuickActionsCard } from './components/QuickActionsCard'
import { BudgetTrackerCard } from './components/BudgetTrackerCard'
import { CashFlowTimeline } from './components/CashFlowTimeline'
import { RecurringItemsCard } from './components/RecurringItemsCard'
import { RecentActivityCard } from './components/RecentActivityCard'

interface PageProps {
  params: Promise<{
    projectId: string
  }>
}

async function fetchFamilyStats(projectId: string, period?: string) {
  const url = period
    ? `/api/projects/${projectId}/family-stats?period=${period}`
    : `/api/projects/${projectId}/family-stats`
  
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch family stats')
  }
  return res.json()
}

export default function FamilyDashboardPage({ params }: PageProps) {
  const { projectId } = use(params)

  // Fetch family stats
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...projectKeys.familyStats(projectId)],
    queryFn: () => fetchFamilyStats(projectId),
  })

  const stats: FamilyDashboardStats | null = data?.stats || null

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-amber-900 dark:text-amber-100">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 dark:bg-gray-950">
        <div className="text-center p-8">
          <p className="text-red-600 dark:text-red-400 mb-4">خطا در بارگذاری داده‌ها</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  const handleRefresh = () => {
    refetch()
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-950 dark:to-gray-900">
      {/* Card Stack Container */}
      <div className="snap-y snap-mandatory h-screen overflow-y-scroll scrollbar-hide">
        {/* Card 1: Monthly Overview */}
        <section className="snap-start min-h-screen flex items-center justify-center p-4">
          <MonthlyOverviewCard
            stats={stats}
            onRefresh={handleRefresh}
            projectId={projectId}
          />
        </section>

        {/* Card 2: Quick Actions */}
        <section className="snap-start min-h-screen flex items-center justify-center p-4">
          <QuickActionsCard projectId={projectId} />
        </section>

        {/* Card 3: Budget Tracker */}
        <section className="snap-start min-h-screen flex items-center justify-center p-4">
          <BudgetTrackerCard
            budgets={stats.budgets}
            totalBudget={stats.totalBudget}
            totalSpent={stats.totalSpent}
            budgetUtilization={stats.budgetUtilization}
            projectId={projectId}
          />
        </section>

        {/* Card 4: Cash Flow Timeline */}
        <section className="snap-start min-h-screen flex items-center justify-center p-4">
          <CashFlowTimeline
            projectId={projectId}
            periodKey={stats.periodKey}
          />
        </section>

        {/* Card 5: Recurring Items */}
        <section className="snap-start min-h-screen flex items-center justify-center p-4">
          <RecurringItemsCard projectId={projectId} />
        </section>

        {/* Card 6: Recent Activity */}
        <section className="snap-start min-h-screen flex items-center justify-center p-4">
          <RecentActivityCard
            recentIncomes={stats.recentIncomes}
            recentExpenses={stats.recentExpenses}
            projectId={projectId}
          />
        </section>
      </div>

      {/* Scroll Indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-6 h-10 border-2 border-amber-500/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-amber-500 rounded-full animate-bounce"></div>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-300">اسکرول کنید</p>
      </div>
    </div>
  )
}
