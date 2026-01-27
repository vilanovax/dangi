import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import { calculateFamilyStats, parsePeriodKey } from '@/lib/domain/calculators/familyStats'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/family-stats - Get family finance dashboard statistics
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

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

    // Get period from query params (default to current month)
    const { searchParams } = new URL(request.url)
    let periodKey = searchParams.get('period')

    if (!periodKey) {
      // Default to current month
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      periodKey = `${year}-${month}`
    }

    // Parse period to dates
    const { startDate, endDate } = parsePeriodKey(periodKey)

    // Calculate stats
    const stats = await calculateFamilyStats(projectId, periodKey, startDate, endDate)

    return NextResponse.json({ stats })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/family-stats' })
    return NextResponse.json({ error: 'خطا در محاسبه آمار' }, { status: 500 })
  }
}
