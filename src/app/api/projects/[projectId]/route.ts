import { NextRequest, NextResponse } from 'next/server'
import { getProjectById, updateProject, deleteProject } from '@/lib/services/project.service'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params
    const project = await getProjectById(projectId)

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })
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

    const { name, description, currency, splitType } = body

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

    const project = await updateProject(projectId, {
      name: name?.trim(),
      description: description !== undefined ? (description?.trim() || null) : undefined,
      currency,
      splitType,
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
