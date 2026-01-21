import { NextRequest, NextResponse } from 'next/server'
import { getProjectByShareCode } from '@/lib/services/project.service'

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
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات پروژه' },
      { status: 500 }
    )
  }
}
