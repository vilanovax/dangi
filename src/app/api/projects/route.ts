import { NextRequest, NextResponse } from 'next/server'
import { createProject } from '@/lib/services/project.service'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/utils/auth'

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
      },
    })

    if (!user) {
      return NextResponse.json({ projects: [], user: null })
    }

    // Find all projects where user is a participant
    const participants = await prisma.participant.findMany({
      where: {
        userId: userId,
      },
      include: {
        project: {
          include: {
            participants: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            _count: {
              select: {
                expenses: true,
              },
            },
          },
        },
      },
    })

    // Build projects list with user info
    const projects = participants.map((p) => ({
      id: p.project.id,
      name: p.project.name,
      template: p.project.template,
      currency: p.project.currency,
      participantCount: p.project.participants.length,
      expenseCount: p.project._count.expenses,
      myParticipantId: p.id,
      myName: p.name,
      myRole: p.role,
      createdAt: p.project.createdAt,
    }))

    // Remove duplicates and sort by creation date
    const uniqueProjects = Array.from(
      new Map(projects.map((p) => [p.id, p])).values()
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      projects: uniqueProjects,
      user,
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
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
    const { name, template } = body

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
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'خطا در ساخت پروژه' },
      { status: 500 }
    )
  }
}
