import { NextRequest, NextResponse } from 'next/server'
import { reverseSettlement, getSettlementById } from '@/lib/services/settlement.service'
import { requireFullProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; settlementId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, settlementId } = await context.params

    // Authorization check: settlement mutations require full member access
    const authResult = await requireFullProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const settlement = await getSettlementById(settlementId)

    if (!settlement) {
      return NextResponse.json({ error: 'تسویه یافت نشد' }, { status: 404 })
    }

    if (settlement.projectId !== projectId) {
      return NextResponse.json({ error: 'تسویه متعلق به این پروژه نیست' }, { status: 403 })
    }

    const body = await request.json()
    const { note } = body

    const reverseSettlementResult = await reverseSettlement(settlementId, note)

    return NextResponse.json({ settlement: reverseSettlementResult }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/settlements/[settlementId]/reverse' })

    // Return user-friendly error messages
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'خطا در بازگردانی تسویه' }, { status: 500 })
  }
}
