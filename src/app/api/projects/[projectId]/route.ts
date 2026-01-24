import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getProjectById, updateProject, deleteProject } from '@/lib/services/project.service'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params

    // Check if expenses should be included (default: true for backward compatibility)
    const searchParams = request.nextUrl.searchParams
    const includeExpenses = searchParams.get('includeExpenses') !== 'false'

    const project = await getProjectById(projectId, includeExpenses)

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    // Get current participant from session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(`session_${projectId}`)?.value

    let myParticipantId: string | null = null
    if (sessionToken) {
      const participant = await prisma.participant.findFirst({
        where: {
          sessionToken,
          projectId,
        },
        select: { id: true },
      })
      myParticipantId = participant?.id || null
    }

    return NextResponse.json({ project, myParticipantId })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات پروژه' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params
    const body = await request.json()

    const { name, description, currency, splitType, chargeYear, isArchived } = body

    // Check if project exists
    const existingProject = await getProjectById(projectId)
    if (!existingProject) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    // Validate name if provided
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'نام پروژه الزامی است' },
        { status: 400 }
      )
    }

    // Validate currency if provided
    const validCurrencies = ['IRR', 'USD', 'EUR', 'AED', 'TRY', 'GBP']
    if (currency !== undefined && !validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'واحد پول نامعتبر است' },
        { status: 400 }
      )
    }

    // Validate splitType if provided
    const validSplitTypes = ['EQUAL', 'WEIGHTED', 'PERCENTAGE', 'MANUAL']
    if (splitType !== undefined && !validSplitTypes.includes(splitType)) {
      return NextResponse.json(
        { error: 'نوع تقسیم نامعتبر است' },
        { status: 400 }
      )
    }

    // Validate chargeYear if provided (Persian year)
    if (chargeYear !== undefined && chargeYear !== null) {
      if (typeof chargeYear !== 'number' || chargeYear < 1400 || chargeYear > 1450) {
        return NextResponse.json(
          { error: 'سال شارژ نامعتبر است' },
          { status: 400 }
        )
      }
    }

    const project = await updateProject(projectId, {
      name: name?.trim(),
      description: description !== undefined ? (description?.trim() || null) : undefined,
      currency,
      splitType,
      chargeYear,
      isArchived,
      archivedAt: isArchived === true ? new Date() : (isArchived === false ? null : undefined),
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی پروژه' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params

    // Check if project exists
    const existingProject = await getProjectById(projectId)
    if (!existingProject) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    await deleteProject(projectId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'خطا در حذف پروژه' },
      { status: 500 }
    )
  }
}
