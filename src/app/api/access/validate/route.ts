import { NextRequest, NextResponse } from 'next/server'
import { validateAccessLink } from '@/lib/services/access-link.service'
import { logApiError } from '@/lib/utils/logger'

/**
 * POST /api/access/validate
 * Validate an access link token (public endpoint)
 *
 * Body: { token: string }
 * Response: { valid: boolean, projectId?: string, scopes?: string[], reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'توکن دسترسی باید مشخص شود' },
        { status: 400 }
      )
    }

    // Validate the access link
    const validation = await validateAccessLink(token)

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        reason: validation.reason,
      })
    }

    // Return validation result (don't expose the full link object)
    return NextResponse.json({
      valid: true,
      projectId: validation.projectId,
      scopes: validation.scopes,
    })
  } catch (error) {
    logApiError(error, { context: 'POST /api/access/validate' })
    return NextResponse.json(
      { error: 'خطا در اعتبارسنجی لینک دسترسی' },
      { status: 500 }
    )
  }
}
