import { NextRequest, NextResponse } from 'next/server'
import { getProjectByShareCode } from '@/lib/services/project.service'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ shareCode: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { shareCode } = await context.params
    const project = await getProjectByShareCode(shareCode)

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        participants: project.participants.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      },
    })
  } catch (error) {
    logApiError(error, { context: 'GET /api/join/[shareCode]' })
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات پروژه' },
      { status: 500 }
    )
  }
}
