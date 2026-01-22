import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getRecentPeriods } from '@/lib/utils/persian-date'

type RouteContext = {
  params: Promise<{ projectId: string }>
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
  }[]
  totalExpected: number
  totalPaid: number
  paidCount: number
  unpaidCount: number
}

// GET /api/projects/[projectId]/charge-status
// Returns charge payment status for each participant by period
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const periodsCount = parseInt(searchParams.get('periods') || '6')

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
        message: 'قاعده شارژی تعریف نشده است',
      })
    }

    // Calculate total expected charge per period
    const totalChargePerPeriod = activeRules.reduce((sum, rule) => sum + rule.amount, 0)

    // Calculate total weight for weighted distribution
    const totalWeight = project.participants.reduce((sum, p) => sum + p.weight, 0)

    // Get recent periods
    const periods = getRecentPeriods(periodsCount)

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
      const participantStatuses = project.participants.map((participant) => {
        // Calculate expected amount based on weight
        const weightRatio = totalWeight > 0 ? participant.weight / totalWeight : 1 / project.participants.length
        const expectedAmount = Math.round(totalChargePerPeriod * weightRatio)

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
        }
      })

      const totalExpected = participantStatuses.reduce((sum, p) => sum + p.expectedAmount, 0)
      const totalPaid = participantStatuses.reduce((sum, p) => sum + p.paidAmount, 0)
      const paidCount = participantStatuses.filter((p) => p.status === 'paid').length
      const unpaidCount = participantStatuses.filter((p) => p.status === 'unpaid').length

      return {
        periodKey: period.key,
        periodLabel: period.label,
        expectedAmount: totalChargePerPeriod,
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
      totalChargePerPeriod,
      participantsCount: project.participants.length,
    })
  } catch (error) {
    console.error('Error fetching charge status:', error)
    return NextResponse.json({ error: 'خطا در دریافت وضعیت شارژ' }, { status: 500 })
  }
}
