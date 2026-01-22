import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { PERSIAN_MONTHS, getCurrentPersianYear } from '@/lib/utils/persian-date'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

interface ChargeExpense {
  id: string
  title: string
  amount: number
  expenseDate: string
}

interface ChargeStatusByPeriod {
  periodKey: string
  periodLabel: string
  expectedAmount: number
  participants: {
    id: string
    name: string
    weight: number
    expectedAmount: number
    paidAmount: number
    status: 'paid' | 'partial' | 'unpaid'
    paidDate?: string
    expenses: ChargeExpense[]
  }[]
  totalExpected: number
  totalPaid: number
  paidCount: number
  unpaidCount: number
}

/**
 * Generate all 12 months of a Persian year (Farvardin to Esfand)
 */
function getYearPeriods(year: number): { key: string; label: string }[] {
  return PERSIAN_MONTHS.map((month) => ({
    key: `${year}-${month.key}`,
    label: `${month.name} ${year}`,
  }))
}

// GET /api/projects/[projectId]/charge-status
// Returns charge payment status for each participant by period
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

    // Get project with participants and charge rules
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        participants: {
          orderBy: { createdAt: 'asc' },
        },
        chargeRules: {
          where: { isActive: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    // Get active charge rules
    const activeRules = project.chargeRules
    if (activeRules.length === 0) {
      return NextResponse.json({
        periods: [],
        chargeYear: project.chargeYear,
        message: 'قاعده شارژی تعریف نشده است',
      })
    }

    // Use project's chargeYear or default to current Persian year
    const chargeYear = project.chargeYear || getCurrentPersianYear()

    // Calculate total charge per unit (fixed amount for each unit)
    const chargePerUnit = activeRules.reduce((sum, rule) => sum + rule.amount, 0)

    // Get all 12 months of the year (Farvardin to Esfand)
    const periods = getYearPeriods(chargeYear)

    // Get all expenses with periodKey for this project
    const expenses = await prisma.expense.findMany({
      where: {
        projectId,
        periodKey: { not: null },
      },
      include: {
        paidBy: true,
      },
    })

    // Build charge status for each period
    const chargeStatus: ChargeStatusByPeriod[] = periods.map((period) => {
      // Find expenses for this period
      const periodExpenses = expenses.filter((e) => e.periodKey === period.key)

      // Calculate each participant's status
      // Each unit pays the same fixed charge amount
      const participantStatuses = project.participants.map((participant) => {
        // Fixed charge amount per unit (not weighted)
        const expectedAmount = chargePerUnit

        // Calculate paid amount (expenses paid by this participant in this period)
        const paidExpenses = periodExpenses.filter((e) => e.paidById === participant.id)
        const paidAmount = paidExpenses.reduce((sum, e) => sum + e.amount, 0)

        // Determine status
        let status: 'paid' | 'partial' | 'unpaid' = 'unpaid'
        if (paidAmount >= expectedAmount * 0.95) {
          status = 'paid'
        } else if (paidAmount > 0) {
          status = 'partial'
        }

        return {
          id: participant.id,
          name: participant.name,
          weight: participant.weight,
          expectedAmount,
          paidAmount,
          status,
          paidDate: paidExpenses.length > 0
            ? paidExpenses[0].expenseDate.toISOString().split('T')[0]
            : undefined,
          expenses: paidExpenses.map((e) => ({
            id: e.id,
            title: e.title,
            amount: e.amount,
            expenseDate: e.expenseDate.toISOString().split('T')[0],
          })),
        }
      })

      const totalExpected = participantStatuses.reduce((sum, p) => sum + p.expectedAmount, 0)
      const totalPaid = participantStatuses.reduce((sum, p) => sum + p.paidAmount, 0)
      const paidCount = participantStatuses.filter((p) => p.status === 'paid').length
      const unpaidCount = participantStatuses.filter((p) => p.status === 'unpaid').length

      return {
        periodKey: period.key,
        periodLabel: period.label,
        expectedAmount: chargePerUnit,
        participants: participantStatuses,
        totalExpected,
        totalPaid,
        paidCount,
        unpaidCount,
      }
    })

    return NextResponse.json({
      periods: chargeStatus,
      chargeRules: activeRules.map((r) => ({
        id: r.id,
        title: r.title,
        amount: r.amount,
      })),
      chargePerUnit,
      chargeYear,
      totalChargePerPeriod: chargePerUnit * project.participants.length,
      participantsCount: project.participants.length,
    })
  } catch (error) {
    console.error('Error fetching charge status:', error)
    return NextResponse.json({ error: 'خطا در دریافت وضعیت شارژ' }, { status: 500 })
  }
}
