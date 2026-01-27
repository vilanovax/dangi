import { NextRequest, NextResponse } from 'next/server'
import { joinProject, getProjectParticipants } from '@/lib/services/participant.service'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/participants - Get all participants
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    const participants = await getProjectParticipants(projectId)

    return NextResponse.json({ participants })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/participants' })
    return NextResponse.json({ error: 'خطا در دریافت اعضا' }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/participants - Add a new participant
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()

    const { name, weight, avatar } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'نام عضو الزامی است' }, { status: 400 })
    }

    // Check if project exists
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    // Add the participant
    const participant = await joinProject({
      projectId,
      name: name.trim(),
      weight: weight || 1,
      avatar: avatar || null,
    })

    return NextResponse.json({ participant }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/participants' })
    return NextResponse.json({ error: 'خطا در افزودن عضو' }, { status: 500 })
  }
}
