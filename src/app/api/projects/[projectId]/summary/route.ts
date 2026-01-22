import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getProjectById } from '@/lib/services/project.service'
import { getProjectSettlements } from '@/lib/services/settlement.service'
import { calculateProjectSummary } from '@/lib/domain/summaryCalculator'
import { PERSIAN_MONTHS, getCurrentPersianYear, getCurrentPersianMonth } from '@/lib/utils/persian-date'

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
    const [project, settlements] = await Promise.all([
      getProjectById(projectId),
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
    })
  } catch (error) {
    console.error('Error calculating summary:', error)
    return NextResponse.json(
      { error: 'خطا در محاسبه خلاصه' },
      { status: 500 }
    )
  }
}
