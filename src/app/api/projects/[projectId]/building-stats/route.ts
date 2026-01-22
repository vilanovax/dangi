import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { PERSIAN_MONTHS, getCurrentPersianYear } from '@/lib/utils/persian-date'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/building-stats
// Returns building statistics and reports
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
        expenses: {
          include: { paidBy: true },
          orderBy: { expenseDate: 'desc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    const chargeYear = project.chargeYear || getCurrentPersianYear()
    const chargePerUnit = project.chargeRules.reduce((sum, rule) => sum + rule.amount, 0)
    const participantsCount = project.participants.length

    // Separate charge expenses (with periodKey) from common expenses (without periodKey)
    const chargeExpenses = project.expenses.filter((e) => e.periodKey !== null)
    const commonExpenses = project.expenses.filter((e) => e.periodKey === null)

    // Calculate monthly stats for the year
    const monthlyStats = PERSIAN_MONTHS.map((month) => {
      const periodKey = `${chargeYear}-${month.key}`
      const periodExpenses = chargeExpenses.filter((e) => e.periodKey === periodKey)

      const paidParticipants = new Set(periodExpenses.map((e) => e.paidById))
      const totalPaid = periodExpenses.reduce((sum, e) => sum + e.amount, 0)
      const totalExpected = chargePerUnit * participantsCount

      return {
        month: month.key,
        monthName: month.name,
        periodKey,
        paidCount: paidParticipants.size,
        unpaidCount: participantsCount - paidParticipants.size,
        totalPaid,
        totalExpected,
        percentage: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0,
      }
    })

    // Calculate overall stats
    const totalExpectedYear = chargePerUnit * participantsCount * 12
    const totalPaidYear = chargeExpenses
      .filter((e) => e.periodKey?.startsWith(`${chargeYear}-`))
      .reduce((sum, e) => sum + e.amount, 0)

    // Common expenses stats
    const totalCommonExpenses = commonExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Participant stats
    const participantStats = project.participants.map((participant) => {
      const participantExpenses = chargeExpenses.filter(
        (e) => e.paidById === participant.id && e.periodKey?.startsWith(`${chargeYear}-`)
      )
      const paidMonths = new Set(participantExpenses.map((e) => e.periodKey))
      const totalPaid = participantExpenses.reduce((sum, e) => sum + e.amount, 0)
      const totalExpected = chargePerUnit * 12 // Full year

      return {
        id: participant.id,
        name: participant.name,
        paidMonths: paidMonths.size,
        totalMonths: 12,
        totalPaid,
        totalExpected,
        percentage: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0,
        status: paidMonths.size === 12 ? 'complete' : paidMonths.size > 0 ? 'partial' : 'none',
      }
    })

    // Recent charge payments (last 10)
    const recentPayments = chargeExpenses.slice(0, 10).map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      paidBy: e.paidBy.name,
      periodKey: e.periodKey,
      date: e.expenseDate.toISOString().split('T')[0],
    }))

    // Recent common expenses (last 10)
    const recentCommonExpenses = commonExpenses.slice(0, 10).map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      paidBy: e.paidBy.name,
      date: e.expenseDate.toISOString().split('T')[0],
    }))

    // Monthly trend data for chart
    const monthlyTrend = monthlyStats.map((m) => ({
      month: m.monthName,
      paid: m.totalPaid,
      expected: m.totalExpected,
    }))

    return NextResponse.json({
      chargeYear,
      chargePerUnit,
      participantsCount,
      yearStats: {
        totalExpected: totalExpectedYear,
        totalPaid: totalPaidYear,
        percentage: totalExpectedYear > 0 ? Math.round((totalPaidYear / totalExpectedYear) * 100) : 0,
        remaining: totalExpectedYear - totalPaidYear,
      },
      monthlyStats,
      monthlyTrend,
      participantStats,
      recentPayments,
      // Common expenses
      commonExpenses: {
        total: totalCommonExpenses,
        count: commonExpenses.length,
        recent: recentCommonExpenses,
      },
    })
  } catch (error) {
    console.error('Error fetching building stats:', error)
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 })
  }
}
