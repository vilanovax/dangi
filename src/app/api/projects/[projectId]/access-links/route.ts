import { NextRequest, NextResponse } from 'next/server'
import {
  createAccessLink,
  getProjectAccessLinks,
} from '@/lib/services/access-link.service'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectOwnerAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { AccessScope } from '@/types/access-link'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

/**
 * GET /api/projects/[projectId]/access-links
 * List all access links for a project
 *
 * Auth: Requires project owner
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

    // Authorization check: only project owners can list raw invite tokens
    const authResult = await requireProjectOwnerAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Verify project exists
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    // Fetch all access links
    const links = await getProjectAccessLinks(projectId)

    return NextResponse.json({ links })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/access-links' })
    return NextResponse.json(
      { error: 'خطا در دریافت لینک‌های دسترسی' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/access-links
 * Create a new access link
 *
 * Auth: Requires project owner
 * Body: { templateId, name?, description?, expiresAt?, maxUses? }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

    // Authorization check: only project owners can create invite links
    const authResult = await requireProjectOwnerAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Verify project exists
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { templateId, name, description, expiresAt, maxUses, scopes, role } = body

    // Validate required fields
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: 'دسترسی‌ها باید مشخص شوند' },
        { status: 400 }
      )
    }

    // Create access link
    const link = await createAccessLink({
      projectId,
      name: name || undefined,
      description: description || undefined,
      scopes: scopes as AccessScope[],
      role: role || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxUses: maxUses || undefined,
    })

    return NextResponse.json({ link }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/access-links' })

    // Return service errors directly (they're user-friendly in Persian)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'خطا در ایجاد لینک دسترسی' },
      { status: 500 }
    )
  }
}
