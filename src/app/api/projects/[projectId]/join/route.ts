import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { joinProject } from '@/lib/services/participant.service'
import { cookies } from 'next/headers'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'نام الزامی است' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    // Create participant
    const participant = await joinProject({
      projectId,
      name,
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(`session_${projectId}`, participant.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.json({ participant })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/join' })
    return NextResponse.json(
      { error: 'خطا در پیوستن به پروژه' },
      { status: 500 }
    )
  }
}
