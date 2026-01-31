import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import { getCurrentPersianYear, getCurrentPersianMonth } from '@/lib/utils/persian-date'

type RouteContext = {
  params: Promise<{ projectId: string; participantId: string }>
}

/**
 * Get payment timeline for a participant
 * Returns monthly payment history ordered by newest first
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, participantId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Get project with charge configuration
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        participants: {
          where: { id: participantId }
        },
        chargeRules: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    if (project.participants.length === 0) {
      return NextResponse.json({ error: 'شرکت‌کننده یافت نشد' }, { status: 404 })
    }

    const participant = project.participants[0]

    // Get all expenses paid by this participant in this project
    const expenses = await prisma.expense.findMany({
      where: {
        projectId,
        paidById: participantId,
        periodKey: { not: null } // Only charges (expenses with periodKey)
      },
      select: {
        id: true,
        amount: true,
        expenseDate: true,
        periodKey: true,
        createdAt: true
      },
      orderBy: {
        expenseDate: 'desc'
      }
    })

    // Group expenses by month (periodKey)
    const monthlyPayments = new Map<string, {
      periodKey: string
      totalPaid: number
      paymentDate: Date | null
      paymentCount: number
    }>()

    for (const expense of expenses) {
      if (!expense.periodKey) continue

      const existing = monthlyPayments.get(expense.periodKey)
      if (existing) {
        existing.totalPaid += expense.amount
        existing.paymentCount += 1
        // Keep the earliest payment date
        if (!existing.paymentDate || expense.expenseDate < existing.paymentDate) {
          existing.paymentDate = expense.expenseDate
        }
      } else {
        monthlyPayments.set(expense.periodKey, {
          periodKey: expense.periodKey,
          totalPaid: expense.amount,
          paymentDate: expense.expenseDate,
          paymentCount: 1
        })
      }
    }

    // Generate timeline for all months in the charge year
    // Persian calendar always has 12 months
    const chargeMonthCount = 12

    // Get current Persian calendar info
    const currentPersianYear = getCurrentPersianYear()
    const currentPersianMonth = parseInt(getCurrentPersianMonth(), 10)

    // Use Persian year for chargeYear if not set
    const chargeYear = project.chargeYear || currentPersianYear

    // Generate all months in the charge year
    const allMonths: Array<{
      periodKey: string
      monthName: string
      status: 'paid' | 'unpaid' | 'partial' | 'upcoming'
      amount: number
      paymentDate: string | null
      paymentCount: number
      expectedAmount: number
    }> = []

    // Persian month names
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]

    const expectedAmount = project.chargeRules.reduce((sum, rule) => sum + rule.amount, 0)

    // Generate timeline for each month
    for (let i = 0; i < chargeMonthCount; i++) {
      const monthIndex = i + 1
      const periodKey = `${chargeYear}-${String(monthIndex).padStart(2, '0')}`
      const payment = monthlyPayments.get(periodKey)

      let status: 'paid' | 'unpaid' | 'partial' | 'upcoming' = 'unpaid'

      if (payment) {
        if (expectedAmount > 0) {
          status = payment.totalPaid >= expectedAmount ? 'paid' : 'partial'
        } else {
          status = 'paid'
        }
      } else {
        // Check if month has started yet (using Persian calendar)
        if (chargeYear > currentPersianYear || (chargeYear === currentPersianYear && monthIndex > currentPersianMonth)) {
          status = 'upcoming'
        }
      }

      allMonths.push({
        periodKey,
        monthName: persianMonths[monthIndex - 1] || `ماه ${monthIndex}`,
        status,
        amount: payment?.totalPaid || 0,
        paymentDate: payment?.paymentDate?.toISOString() || null,
        paymentCount: payment?.paymentCount || 0,
        expectedAmount
      })
    }

    // Sort by periodKey descending (newest first)
    allMonths.sort((a, b) => b.periodKey.localeCompare(a.periodKey))

    return NextResponse.json({
      timeline: allMonths,
      participant: {
        id: participant.id,
        name: participant.name
      },
      summary: {
        totalMonths: chargeMonthCount,
        paidMonths: allMonths.filter(m => m.status === 'paid').length,
        partialMonths: allMonths.filter(m => m.status === 'partial').length,
        unpaidMonths: allMonths.filter(m => m.status === 'unpaid').length
      }
    })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/participants/[participantId]/payment-history' })
    return NextResponse.json({ error: 'خطا در دریافت سوابق پرداخت' }, { status: 500 })
  }
}
