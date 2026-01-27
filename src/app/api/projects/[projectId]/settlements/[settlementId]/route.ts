import { NextRequest, NextResponse } from 'next/server'
import { getSettlementById, updateSettlement, deleteSettlement } from '@/lib/services/settlement.service'
import { getProjectById } from '@/lib/services/project.service'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; settlementId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, settlementId } = await context.params

    const settlement = await getSettlementById(settlementId)

    if (!settlement) {
      return NextResponse.json({ error: 'تسویه یافت نشد' }, { status: 404 })
    }

    if (settlement.projectId !== projectId) {
      return NextResponse.json({ error: 'تسویه متعلق به این پروژه نیست' }, { status: 403 })
    }

    return NextResponse.json({ settlement })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/settlements/[settlementId]' })
    return NextResponse.json({ error: 'خطا در دریافت تسویه' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, settlementId } = await context.params

    const existingSettlement = await getSettlementById(settlementId)

    if (!existingSettlement) {
      return NextResponse.json({ error: 'تسویه یافت نشد' }, { status: 404 })
    }

    if (existingSettlement.projectId !== projectId) {
      return NextResponse.json({ error: 'تسویه متعلق به این پروژه نیست' }, { status: 403 })
    }

    const body = await request.json()
    const { fromId, toId, amount, note, receiptUrl, settledAt } = body

    // Validation
    if (amount !== undefined) {
      const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'مبلغ باید عدد مثبت باشد' }, { status: 400 })
      }
    }

    // Check participants if changed
    if (fromId !== undefined || toId !== undefined) {
      const newFromId = fromId || existingSettlement.fromId
      const newToId = toId || existingSettlement.toId

      if (newFromId === newToId) {
        return NextResponse.json(
          { error: 'پرداخت‌کننده و دریافت‌کننده نمی‌توانند یکی باشند' },
          { status: 400 }
        )
      }

      const project = await getProjectById(projectId)
      if (!project) {
        return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
      }

      const projectParticipantIds = project.participants.map((p) => p.id)
      if (!projectParticipantIds.includes(newFromId) || !projectParticipantIds.includes(newToId)) {
        return NextResponse.json(
          { error: 'هر دو طرف باید عضو پروژه باشند' },
          { status: 400 }
        )
      }
    }

    const settlement = await updateSettlement(settlementId, {
      fromId,
      toId,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      note,
      receiptUrl,
      settledAt: settledAt ? new Date(settledAt) : undefined,
    })

    return NextResponse.json({ settlement })
  } catch (error) {
    logApiError(error, { context: 'PATCH /api/projects/[projectId]/settlements/[settlementId]' })
    return NextResponse.json({ error: 'خطا در ویرایش تسویه' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, settlementId } = await context.params

    const existingSettlement = await getSettlementById(settlementId)

    if (!existingSettlement) {
      return NextResponse.json({ error: 'تسویه یافت نشد' }, { status: 404 })
    }

    if (existingSettlement.projectId !== projectId) {
      return NextResponse.json({ error: 'تسویه متعلق به این پروژه نیست' }, { status: 403 })
    }

    await deleteSettlement(settlementId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, { context: 'DELETE /api/projects/[projectId]/settlements/[settlementId]' })
    return NextResponse.json({ error: 'خطا در حذف تسویه' }, { status: 500 })
  }
}
