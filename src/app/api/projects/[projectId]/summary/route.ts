import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getProjectSettlements } from '@/lib/services/settlement.service'
import { calculateProjectSummary } from '@/lib/domain/summaryCalculator'
import { PERSIAN_MONTHS, getCurrentPersianYear, getCurrentPersianMonth } from '@/lib/utils/persian-date'
import type { CategoryBreakdown, ParticipantExpenseBreakdown } from '@/types'
import { requireProjectAccess } from '@/lib/utils/auth'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

// Get previous month key
function getPreviousMonthKey(year: number): string {
  const currentMonth = getCurrentPersianMonth()
  const monthNum = parseInt(currentMonth)

  if (monthNum === 1) {
    // Farvardin -> Esfand of previous year
    return `${year - 1}-12`
  }

  const prevMonth = (monthNum - 1).toString().padStart(2, '0')
  return `${year}-${prevMonth}`
}

// Calculate charge debt for each participant up to previous month
async function calculateChargeDebt(
  projectId: string,
  participants: { id: string; name: string }[],
  chargeYear: number,
  chargePerUnit: number
): Promise<{ participantId: string; participantName: string; chargeDebt: number; paidMonths: number; totalMonths: number }[]> {
  // Get current month number (1-12)
  const currentMonth = parseInt(getCurrentPersianMonth())

  // Calculate total months that should be paid (from Farvardin up to previous month)
  const totalMonthsToPay = currentMonth - 1 // e.g., if current is Bahman (11), they should have paid 10 months

  if (totalMonthsToPay <= 0) {
    // We're in Farvardin, no previous months to check
    return participants.map((p) => ({
      participantId: p.id,
      participantName: p.name,
      chargeDebt: 0,
      paidMonths: 0,
      totalMonths: 0,
    }))
  }

  // Get all period keys up to previous month
  const periodKeys = PERSIAN_MONTHS.slice(0, totalMonthsToPay).map(
    (m) => `${chargeYear}-${m.key}`
  )

  // Get expenses with periodKey for this project
  const expenses = await prisma.expense.findMany({
    where: {
      projectId,
      periodKey: { in: periodKeys },
    },
  })

  // Calculate debt for each participant
  return participants.map((participant) => {
    const participantExpenses = expenses.filter((e) => e.paidById === participant.id)
    const paidPeriods = new Set(participantExpenses.map((e) => e.periodKey))
    const paidMonths = paidPeriods.size
    const unpaidMonths = totalMonthsToPay - paidMonths
    const chargeDebt = unpaidMonths * chargePerUnit

    return {
      participantId: participant.id,
      participantName: participant.name,
      chargeDebt,
      paidMonths,
      totalMonths: totalMonthsToPay,
    }
  })
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Fetch project with full expense data (required for summary)
    const [project, settlements] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          participants: true,
          categories: true,
          expenses: {
            include: {
              paidBy: true,
              category: true,
              shares: {
                include: {
                  participant: true,
                },
              },
            },
            orderBy: {
              expenseDate: 'desc',
            },
          },
        },
      }),
      getProjectSettlements(projectId),
    ])

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    const summary = calculateProjectSummary({
      projectId: project.id,
      projectName: project.name,
      currency: project.currency,
      participants: project.participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
      expenses: project.expenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        paidById: e.paidById,
        shares: e.shares.map((s) => ({
          participantId: s.participantId,
          amount: s.amount,
        })),
      })),
      existingSettlements: settlements.map((s) => ({
        id: s.id,
        amount: s.amount,
        fromId: s.fromId,
        toId: s.toId,
      })),
    })

    // Check if this is a building template and has charge rules
    let chargeDebts: { participantId: string; participantName: string; chargeDebt: number; paidMonths: number; totalMonths: number }[] = []
    let chargeYear = getCurrentPersianYear()
    let chargePerUnit = 0
    let currentMonthName = ''

    if (project.template === 'building') {
      // Get active charge rules
      const chargeRules = await prisma.chargeRule.findMany({
        where: { projectId, isActive: true },
      })

      if (chargeRules.length > 0) {
        chargeYear = project.chargeYear || getCurrentPersianYear()
        chargePerUnit = chargeRules.reduce((sum, rule) => sum + rule.amount, 0)

        // Get current month name
        const currentMonth = getCurrentPersianMonth()
        const monthInfo = PERSIAN_MONTHS.find((m) => m.key === currentMonth)
        currentMonthName = monthInfo?.name || ''

        // Calculate charge debt
        chargeDebts = await calculateChargeDebt(
          projectId,
          project.participants.map((p) => ({ id: p.id, name: p.name })),
          chargeYear,
          chargePerUnit
        )
      }
    }

    // Calculate category breakdown for gathering template
    let categoryBreakdown: CategoryBreakdown[] = []

    if (project.template === 'gathering') {
      // Group expenses by category
      const categoryMap = new Map<string | null, {
        name: string
        icon: string
        color: string
        total: number
        count: number
      }>()

      // Calculate total for percentage
      const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0)

      // Process each expense
      for (const expense of project.expenses) {
        const catId = expense.category?.id || null
        const catName = expense.category?.name || 'سایر'
        const catIcon = expense.category?.icon || '📝'
        const catColor = expense.category?.color || '#6B7280'

        if (categoryMap.has(catId)) {
          const existing = categoryMap.get(catId)!
          existing.total += expense.amount
          existing.count += 1
        } else {
          categoryMap.set(catId, {
            name: catName,
            icon: catIcon,
            color: catColor,
            total: expense.amount,
            count: 1,
          })
        }
      }

      // Convert to array and calculate percentage
      categoryBreakdown = Array.from(categoryMap.entries()).map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        categoryIcon: data.icon,
        categoryColor: data.color,
        totalAmount: data.total,
        expenseCount: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      }))

      // Sort by total amount (highest first)
      categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount)
    }

    // Calculate participant expense breakdown for gathering template
    let participantExpenseBreakdown: ParticipantExpenseBreakdown[] = []

    if (project.template === 'gathering') {
      // Group expenses by paidBy participant
      const participantMap = new Map<string, {
        name: string
        avatar: string | null
        total: number
        count: number
      }>()

      // Calculate total for percentage
      const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0)

      // Process each expense
      for (const expense of project.expenses) {
        const participantId = expense.paidById
        const participant = project.participants.find((p) => p.id === participantId)

        if (!participant) continue

        if (participantMap.has(participantId)) {
          const existing = participantMap.get(participantId)!
          existing.total += expense.amount
          existing.count += 1
        } else {
          participantMap.set(participantId, {
            name: participant.name,
            avatar: participant.avatar,
            total: expense.amount,
            count: 1,
          })
        }
      }

      // Convert to array and calculate percentage
      participantExpenseBreakdown = Array.from(participantMap.entries()).map(([id, data]) => ({
        participantId: id,
        participantName: data.name,
        participantAvatar: data.avatar,
        totalExpenses: data.total,
        expenseCount: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      }))

      // Sort by total expenses (highest first)
      participantExpenseBreakdown.sort((a, b) => b.totalExpenses - a.totalExpenses)
    }

    return NextResponse.json({
      summary,
      chargeInfo: {
        isBuilding: project.template === 'building',
        chargeYear,
        chargePerUnit,
        currentMonthName,
        chargeDebts,
        totalChargeDebt: chargeDebts.reduce((sum, d) => sum + d.chargeDebt, 0),
      },
      categoryBreakdown,
      participantExpenseBreakdown,
    })
  } catch (error) {
    console.error('Error calculating summary:', error)
    return NextResponse.json(
      { error: 'خطا در محاسبه خلاصه' },
      { status: 500 }
    )
  }
}
