import { NextRequest, NextResponse } from 'next/server'
import {
  getAccessLinkById,
  deactivateAccessLink,
  reactivateAccessLink,
} from '@/lib/services/access-link.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; linkId: string }>
}

/**
 * POST /api/projects/[projectId]/access-links/[linkId]/toggle
 * Toggle access link active status (activate/deactivate)
 *
 * Auth: Requires project membership
 * Body: { isActive: boolean }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, linkId } = await context.params

    // Authorization check
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const existingLink = await getAccessLinkById(linkId)

    if (!existingLink) {
      return NextResponse.json({ error: 'لینک دسترسی یافت نشد' }, { status: 404 })
    }

    // Verify link belongs to this project
    if (existingLink.projectId !== projectId) {
      return NextResponse.json(
        { error: 'لینک متعلق به این پروژه نیست' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'وضعیت باید مشخص شود' },
        { status: 400 }
      )
    }

    // Toggle link status
    const link = isActive
      ? await reactivateAccessLink(linkId)
      : await deactivateAccessLink(linkId)

    return NextResponse.json({ link })
  } catch (error) {
    logApiError(error, {
      context: 'POST /api/projects/[projectId]/access-links/[linkId]/toggle',
    })

    // Return service errors directly
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت لینک' },
      { status: 500 }
    )
  }
}
