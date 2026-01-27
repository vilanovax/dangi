import { NextRequest, NextResponse } from 'next/server'
import { createProject } from '@/lib/services/project.service'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

// Get projects for logged-in user
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ projects: [], user: null })
    }

    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json({ projects: [], user: null })
    }

    // Get user and their projects
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        avatar: true,
      },
    })

    if (!user) {
      return NextResponse.json({ projects: [], user: null })
    }

    // Find all projects where user is a participant
    // Optimized: only fetch necessary data for list view
    const participants = await prisma.participant.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        project: {
          select: {
            id: true,
            name: true,
            template: true,
            currency: true,
            isArchived: true,
            createdAt: true,
            _count: {
              select: {
                participants: true,
                expenses: true,
              },
            },
          },
        },
      },
    })

    // Get project IDs for aggregation queries
    const projectIds = participants.map((p) => p.project.id)

    // Optimized: Get total expenses per project in a single query
    const expenseSums = await prisma.expense.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projectIds },
      },
      _sum: {
        amount: true,
      },
    })

    // Create a map for quick lookup
    const expenseSumMap = new Map(
      expenseSums.map((e) => [e.projectId, e._sum.amount || 0])
    )

    // Build projects list (optimized: minimal data fetching)
    const projects = participants.map((p) => {
      const totalExpenses = expenseSumMap.get(p.project.id) || 0

      return {
        id: p.project.id,
        name: p.project.name,
        template: p.project.template,
        currency: p.project.currency,
        participantCount: p.project._count.participants,
        expenseCount: p.project._count.expenses,
        totalExpenses,
        // Note: myBalance removed for performance - use summary API for detailed balance
        myBalance: 0, // Placeholder for frontend compatibility
        myParticipantId: p.id,
        myName: p.name,
        myRole: p.role,
        isArchived: p.project.isArchived,
        createdAt: p.project.createdAt,
      }
    })

    // Remove duplicates and sort by creation date
    const uniqueProjects = Array.from(
      new Map(projects.map((p) => [p.id, p])).values()
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      projects: uniqueProjects,
      user,
    })
  } catch (error) {
    logApiError(error, { context: 'fetch projects' })
    return NextResponse.json(
      { error: 'خطا در دریافت پروژه‌ها' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    // Get current user if logged in
    let userId: string | null = null
    if (token) {
      userId = verifyToken(token)
    }

    const body = await request.json()
    const { name, template, trackingOnly } = body

    if (!name) {
      return NextResponse.json(
        { error: 'نام پروژه الزامی است' },
        { status: 400 }
      )
    }

    // Get owner name from user or request
    let ownerName = body.ownerName
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      })
      ownerName = user?.name || ownerName
    }

    if (!ownerName) {
      return NextResponse.json(
        { error: 'نام شما الزامی است' },
        { status: 400 }
      )
    }

    const { project, ownerToken } = await createProject({
      name,
      ownerName,
      template,
      trackingOnly: trackingOnly ?? false,
      userId: userId || undefined,
    })

    // Set session cookie for project
    cookieStore.set(`session_${project.id}`, ownerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.json({ project })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects' })
    return NextResponse.json(
      { error: 'خطا در ساخت پروژه' },
      { status: 500 }
    )
  }
}
