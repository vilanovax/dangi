import { NextRequest, NextResponse } from 'next/server'
import { createSettlement, getProjectSettlements } from '@/lib/services/settlement.service'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    const settlements = await getProjectSettlements(projectId)
    return NextResponse.json({ settlements })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/settlements' })
    return NextResponse.json({ error: 'خطا در دریافت تسویه‌ها' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { fromId, toId, amount, note, receiptUrl, settledAt } = body

    // Validation
    if (!fromId || !toId) {
      return NextResponse.json(
        { error: 'پرداخت‌کننده و دریافت‌کننده باید مشخص شوند' },
        { status: 400 }
      )
    }

    if (fromId === toId) {
      return NextResponse.json(
        { error: 'پرداخت‌کننده و دریافت‌کننده نمی‌توانند یکی باشند' },
        { status: 400 }
      )
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'مبلغ باید عدد مثبت باشد' }, { status: 400 })
    }

    // Check participants exist
    const projectParticipantIds = project.participants.map((p) => p.id)
    if (!projectParticipantIds.includes(fromId) || !projectParticipantIds.includes(toId)) {
      return NextResponse.json(
        { error: 'هر دو طرف باید عضو پروژه باشند' },
        { status: 400 }
      )
    }

    const settlement = await createSettlement(projectId, {
      fromId,
      toId,
      amount: parsedAmount,
      note,
      receiptUrl,
      settledAt: settledAt ? new Date(settledAt) : undefined,
    })

    return NextResponse.json({ settlement }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/settlements' })
    return NextResponse.json({ error: 'خطا در ثبت تسویه' }, { status: 500 })
  }
}
