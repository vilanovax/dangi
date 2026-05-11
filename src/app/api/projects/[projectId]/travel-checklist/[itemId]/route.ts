import { NextRequest, NextResponse } from 'next/server'
import { toggleTravelChecklistItem, deleteTravelChecklistItem } from '@/lib/services/checklist.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import { prisma } from '@/lib/db/prisma'
import { isAppError } from '@/lib/errors'

type RouteContext = {
  params: Promise<{ projectId: string; itemId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, itemId } = await context.params

    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()
    const { status } = body

    if (!['active', 'done'].includes(status)) {
      return NextResponse.json({ error: 'وضعیت نامعتبر' }, { status: 400 })
    }

    const item = await toggleTravelChecklistItem(projectId, itemId, status)
    return NextResponse.json({ item })
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    logApiError(error, { context: 'PATCH /api/projects/[projectId]/travel-checklist/[itemId]' })
    return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, itemId } = await context.params

    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if current user is the creator
    const item = await prisma.travelChecklistItem.findFirst({
      where: {
        id: itemId,
        projectId,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
    }

    if (item.createdById !== authResult.participant.id) {
      return NextResponse.json(
        { error: 'فقط سازنده می‌تواند حذف کند' },
        { status: 403 }
      )
    }

    await deleteTravelChecklistItem(projectId, itemId)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    logApiError(error, { context: 'DELETE /api/projects/[projectId]/travel-checklist/[itemId]' })
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 })
  }
}
