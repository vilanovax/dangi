import { NextRequest, NextResponse } from 'next/server'
import { getTravelChecklist, createTravelChecklistItem } from '@/lib/services/checklist.service'
import { requireProjectAccess, requireProjectAccessWithLink } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

    // Allow both participant and link-based access (read-only)
    const authResult = await requireProjectAccessWithLink(projectId, ['project:read'])
    if (!authResult.authorized) {
      return authResult.response
    }

    const items = await getTravelChecklist(projectId)
    return NextResponse.json({ items })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/travel-checklist' })
    return NextResponse.json({ error: 'خطا در دریافت لیست' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params

    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()
    const { text } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'متن الزامی است' }, { status: 400 })
    }

    // Get current participant ID from auth
    const participantId = authResult.participant.id

    const item = await createTravelChecklistItem(projectId, participantId, text)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/travel-checklist' })
    return NextResponse.json({ error: 'خطا در افزودن' }, { status: 500 })
  }
}
