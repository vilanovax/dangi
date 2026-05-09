import { NextRequest, NextResponse } from 'next/server'
import { confirmSettlement, getSettlementById } from '@/lib/services/settlement.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; settlementId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, settlementId } = await context.params

    // Authorization check: restricted participants need settlement write permission.
    const authResult = await requireProjectAccess(projectId, ['settlements:create'])
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

    const confirmedSettlement = await confirmSettlement(settlementId)

    return NextResponse.json({ settlement: confirmedSettlement })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/settlements/[settlementId]/confirm' })

    // Return user-friendly error messages
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'خطا در تأیید تسویه' }, { status: 500 })
  }
}
