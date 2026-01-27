import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/utils/auth'
import { getProjectById } from '@/lib/services/project.service'
import { calculateFamilyStats } from '@/lib/domain/calculators/familyStats'
import { recurringService } from '@/lib/services/recurring.service'
import {
  getCurrentPeriodKey,
  getPersianPeriodBounds,
} from '@/lib/utils/persian-date'
import {
  MonthlyOverviewCard,
  QuickActionsCard,
  BudgetTrackerCard,
  RecurringItemsCard,
  RecentActivityCard,
} from './components'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function FamilyDashboardPage({ params }: PageProps) {
  const { projectId } = await params

  // Auth check
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/auth')
  }

  // Get project
  const project = await getProjectById(projectId)
  if (!project) {
    redirect('/')
  }

  // Verify this is a family template
  if (project.template !== 'family') {
    redirect(`/project/${projectId}`)
  }

  // Get current period (Persian/Shamsi calendar)
  const periodKey = getCurrentPeriodKey() // e.g., "1403-10"

  // Calculate period dates (convert Persian to Gregorian)
  const { startDate, endDate } = getPersianPeriodBounds(periodKey)

  // Fetch dashboard data
  const [stats, recurringTransactions] = await Promise.all([
    calculateFamilyStats(projectId, periodKey, startDate, endDate),
    recurringService.getAll(projectId),
  ])

  // Transform recurring transactions for the card
  const recurringItems = recurringTransactions.map((item) => ({
    id: item.id,
    type: item.type as 'INCOME' | 'EXPENSE',
    title: item.title,
    amount: item.amount,
    frequency: item.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    isActive: item.isActive,
    participantName: item.participant.name,
    categoryName: item.category?.name,
    categoryIcon: item.category?.icon || undefined,
  }))

  return (
    <div className="h-screen w-full overflow-y-auto snap-y snap-mandatory">
      {/* Card 1: Monthly Overview */}
      <MonthlyOverviewCard
        totalIncome={stats.totalIncome}
        totalExpenses={stats.totalExpenses}
        savingsRate={stats.savingsRate}
        currency={project.currency}
        periodKey={periodKey}
      />

      {/* Card 2: Quick Actions */}
      <QuickActionsCard projectId={projectId} />

      {/* Card 3: Budget Tracker */}
      <BudgetTrackerCard
        budgets={stats.budgets}
        totalBudget={stats.totalBudget}
        totalSpent={stats.totalSpent}
        budgetUtilization={stats.budgetUtilization}
        currency={project.currency}
      />

      {/* Card 4: Recurring Items */}
      <RecurringItemsCard
        items={recurringItems}
        currency={project.currency}
        projectId={projectId}
      />

      {/* Card 5: Recent Activity */}
      <RecentActivityCard
        recentIncomes={stats.recentIncomes}
        recentExpenses={stats.recentExpenses}
        currency={project.currency}
      />
    </div>
  )
}
