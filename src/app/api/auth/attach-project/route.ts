import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/utils/auth'
import { validateAccessLink } from '@/lib/services/access-link.service'
import { attachProjectToUser } from '@/lib/services/participant.service'
import { logApiError } from '@/lib/utils/logger'

/**
 * POST /api/auth/attach-project
 *
 * Attach a project to the current user's account via access link
 *
 * Flow:
 * 1. User signs up/logs in with access link in session
 * 2. This endpoint is called to attach the project
 * 3. Creates a Participant linking user to project
 * 4. Role is strictly from access link (no approval, no upgrade)
 *
 * Security:
 * - Requires authenticated user
 * - Validates access link token
 * - Role never exceeds what link grants
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'لطفاً ابتدا وارد شوید' },
        { status: 401 }
      )
    }

    // Get access link token from cookie
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'لینک دسترسی یافت نشد' },
        { status: 400 }
      )
    }

    // Validate access link
    const validation = await validateAccessLink(accessToken)

    if (!validation.valid || !validation.link) {
      return NextResponse.json(
        { error: 'لینک دسترسی نامعتبر است' },
        { status: 400 }
      )
    }

    const { link } = validation

    // Attach project to user account
    // Security: Role is strictly what the link grants
    const participant = await attachProjectToUser(
      currentUser.id,
      link.projectId,
      link.role || 'viewer', // Default to viewer if role not set
      currentUser.name
    )

    // Clear access_token cookie - no longer needed
    // User now has direct participant access
    cookieStore.delete('access_token')

    return NextResponse.json({
      success: true,
      message: 'این پروژه به حساب شما اضافه شد 🎉',
      participant: {
        id: participant.id,
        projectId: participant.projectId,
        role: participant.role,
      },
    })
  } catch (error) {
    logApiError(error, { context: 'POST /api/auth/attach-project' })
    return NextResponse.json(
      { error: 'خطا در ذخیره پروژه' },
      { status: 500 }
    )
  }
}
