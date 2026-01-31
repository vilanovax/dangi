import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

/**
 * GET /api/projects/[projectId]/month-charge-status?periodKey=1403-07
 * Returns detailed charge status for a specific month
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const periodKey = searchParams.get('periodKey')

    if (!periodKey) {
      return NextResponse.json({ error: 'periodKey required' }, { status: 400 })
    }

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

    const chargePerUnit = project.chargeRules.reduce((sum, rule) => sum + rule.amount, 0)

    // Get all charge payments for this period
    const chargePayments = await prisma.expense.findMany({
      where: {
        projectId,
        periodKey,
      },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Build unit status for this month
    const unitStatuses = project.participants.map((participant) => {
      // Find payments by this participant for this period
      const payments = chargePayments.filter((p) => p.paidById === participant.id)
      const totalPaid = payments.reduce((sum, p) => p.amount, 0)
      const hasPaid = totalPaid >= chargePerUnit

      return {
        id: participant.id,
        name: participant.name,
        weight: participant.weight,
        expectedAmount: chargePerUnit,
        paidAmount: totalPaid,
        hasPaid,
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          date: p.expenseDate.toISOString(),
        })),
      }
    })

    const paidCount = unitStatuses.filter((u) => u.hasPaid).length
    const unpaidCount = unitStatuses.length - paidCount
    const totalPaid = unitStatuses.reduce((sum, u) => sum + u.paidAmount, 0)
    const totalExpected = chargePerUnit * project.participants.length

    return NextResponse.json({
      periodKey,
      chargePerUnit,
      participantsCount: project.participants.length,
      paidCount,
      unpaidCount,
      totalPaid,
      totalExpected,
      percentage: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0,
      units: unitStatuses,
    })
  } catch (error: any) {
    console.error('Error fetching month charge status:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات', details: error.message },
      { status: 500 }
    )
  }
}
