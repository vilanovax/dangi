import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { incomeCategoryService } from '@/lib/services/income-category.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { CreateIncomeCategoryInput } from '@/lib/services/income-category.service'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/income-categories - Get all income categories
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

    // Get all income categories
    const categories = await incomeCategoryService.getAll(projectId)

    return NextResponse.json({ categories })
  } catch (error) {
    logApiError(error, {
      context: 'GET /api/projects/[projectId]/income-categories',
    })
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی‌های درآمد' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/income-categories - Create a new income category
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (
      !body.name ||
      typeof body.name !== 'string' ||
      body.name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    // Create category data
    const categoryData: CreateIncomeCategoryInput = {
      name: body.name.trim(),
      icon: body.icon || undefined,
      color: body.color || undefined,
    }

    // Create income category
    const category = await incomeCategoryService.create(projectId, categoryData)

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    logApiError(error, {
      context: 'POST /api/projects/[projectId]/income-categories',
    })
    return NextResponse.json(
      { error: 'خطا در ایجاد دسته‌بندی درآمد' },
      { status: 500 }
    )
  }
}
