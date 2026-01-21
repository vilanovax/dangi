import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { calculateProjectSummary } from '@/lib/domain/summaryCalculator'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params
    const project = await getProjectById(projectId)

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
    })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error calculating summary:', error)
    return NextResponse.json(
      { error: 'خطا در محاسبه خلاصه' },
      { status: 500 }
    )
  }
}
