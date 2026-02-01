import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateAccessLink, incrementLinkUsage } from '@/lib/services/access-link.service'
import { getProjectById } from '@/lib/services/project.service'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ token: string }>
}

/**
 * GET /api/access/[token]
 * Access a project via access link token (public endpoint)
 *
 * Sets access_token cookie for subsequent requests
 * Increments link usage count
 *
 * Response: { project: {...}, scopes: [...], expiresAt: ... }
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params

    if (!token) {
      return NextResponse.json(
        { error: 'توکن دسترسی باید مشخص شود' },
        { status: 400 }
      )
    }

    // Validate the access link
    const validation = await validateAccessLink(token)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || 'دسترسی رد شد' },
        { status: 403 }
      )
    }

    const { projectId, scopes, link } = validation

    if (!projectId || !link) {
      return NextResponse.json(
        { error: 'لینک دسترسی نامعتبر است' },
        { status: 403 }
      )
    }

    // Get project details (limited info for security)
    const project = await getProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    // Increment link usage count
    try {
      await incrementLinkUsage(link.id)
    } catch (error) {
      // Log but don't fail the request if usage increment fails
      logApiError(error, { context: 'incrementLinkUsage' })
    }

    // Set access_token cookie for subsequent requests
    const cookieStore = await cookies()
    cookieStore.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Return project info and access details
    // Filter sensitive data - don't expose participant emails, phone numbers, etc.
    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        template: project.template,
        currency: project.currency,
      },
      scopes,
      expiresAt: link.expiresAt,
      linkName: link.name,
      linkDescription: link.description,
    })
  } catch (error) {
    logApiError(error, { context: 'GET /api/access/[token]' })
    return NextResponse.json(
      { error: 'خطا در دسترسی به پروژه' },
      { status: 500 }
    )
  }
}
