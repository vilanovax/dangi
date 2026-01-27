import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { recurringService } from '@/lib/services/recurring.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ projectId: string; id: string }>
}

// POST /api/projects/[projectId]/recurring/[id]/toggle - Toggle active/inactive status
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, id } = await params

    // Authorization check
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if project exists and is family template
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    if (project.template !== 'family') {
      return NextResponse.json(
        { error: 'این API فقط برای تمپلیت خانواده است' },
        { status: 400 }
      )
    }

    // Toggle recurring transaction status
    const recurring = await recurringService.toggle(projectId, id)

    return NextResponse.json({
      recurring,
      message: `تراکنش تکراری ${recurring.isActive ? 'فعال' : 'غیرفعال'} شد`,
    })
  } catch (error) {
    logApiError(error, {
      context: 'POST /api/projects/[projectId]/recurring/[id]/toggle',
    })
    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت تراکنش تکراری' },
      { status: 500 }
    )
  }
}
