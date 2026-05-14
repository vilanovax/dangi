import { NextRequest, NextResponse } from 'next/server'
import {
  getAccessLinkById,
  updateAccessLink,
  deleteAccessLink,
} from '@/lib/services/access-link.service'
import { requireProjectOwnerAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { AccessScope } from '@/types/access-link'

type RouteContext = {
  params: Promise<{ projectId: string; linkId: string }>
}

/**
 * GET /api/projects/[projectId]/access-links/[linkId]
 * Get a single access link
 *
 * Auth: Requires project owner
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, linkId } = await context.params

    // Authorization check
    const authResult = await requireProjectOwnerAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const link = await getAccessLinkById(linkId)

    if (!link) {
      return NextResponse.json({ error: 'لینک دسترسی یافت نشد' }, { status: 404 })
    }

    // Verify link belongs to this project
    if (link.projectId !== projectId) {
      return NextResponse.json(
        { error: 'لینک متعلق به این پروژه نیست' },
        { status: 403 }
      )
    }

    return NextResponse.json({ link })
  } catch (error) {
    logApiError(error, {
      context: 'GET /api/projects/[projectId]/access-links/[linkId]',
    })
    return NextResponse.json({ error: 'خطا در دریافت لینک' }, { status: 500 })
  }
}

/**
 * PATCH /api/projects/[projectId]/access-links/[linkId]
 * Update an access link
 *
 * Auth: Requires project owner
 * Body: { name?, description?, expiresAt?, maxUses?, isActive? }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, linkId } = await context.params

    // Authorization check
    const authResult = await requireProjectOwnerAccess(projectId)
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
    const { name, description, expiresAt, maxUses, isActive, scopes } = body

    // Update link
    const link = await updateAccessLink(linkId, {
      name: name !== undefined ? name : undefined,
      description: description !== undefined ? description : undefined,
      expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
      maxUses: maxUses !== undefined ? maxUses : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      scopes: scopes !== undefined ? (scopes as AccessScope[]) : undefined,
    })

    return NextResponse.json({ link })
  } catch (error) {
    logApiError(error, {
      context: 'PATCH /api/projects/[projectId]/access-links/[linkId]',
    })

    // Return service errors directly
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'خطا در ویرایش لینک' }, { status: 500 })
  }
}

/**
 * DELETE /api/projects/[projectId]/access-links/[linkId]
 * Delete an access link permanently
 *
 * Auth: Requires project owner
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, linkId } = await context.params

    // Authorization check
    const authResult = await requireProjectOwnerAccess(projectId)
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

    await deleteAccessLink(linkId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, {
      context: 'DELETE /api/projects/[projectId]/access-links/[linkId]',
    })

    // Return service errors directly
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'خطا در حذف لینک' }, { status: 500 })
  }
}
