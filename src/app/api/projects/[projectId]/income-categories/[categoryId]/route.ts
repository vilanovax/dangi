import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { incomeCategoryService } from '@/lib/services/income-category.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { UpdateIncomeCategoryInput } from '@/lib/services/income-category.service'

interface RouteParams {
  params: Promise<{ projectId: string; categoryId: string }>
}

// GET /api/projects/[projectId]/income-categories/[categoryId] - Get a single income category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, categoryId } = await params

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

    // Get income category
    const category = await incomeCategoryService.getById(projectId, categoryId)

    if (!category) {
      return NextResponse.json(
        { error: 'دسته‌بندی درآمد یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    logApiError(error, {
      context: 'GET /api/projects/[projectId]/income-categories/[categoryId]',
    })
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی درآمد' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[projectId]/income-categories/[categoryId] - Update an income category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, categoryId } = await params

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

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'نام دسته‌بندی نمی‌تواند خالی باشد' },
          { status: 400 }
        )
      }
    }

    // Create update data
    const updateData: UpdateIncomeCategoryInput = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color

    // Update income category
    const category = await incomeCategoryService.update(
      projectId,
      categoryId,
      updateData
    )

    return NextResponse.json({ category })
  } catch (error) {
    logApiError(error, {
      context: 'PUT /api/projects/[projectId]/income-categories/[categoryId]',
    })
    return NextResponse.json(
      { error: 'خطا در ویرایش دسته‌بندی درآمد' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[projectId]/income-categories/[categoryId] - Delete an income category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, categoryId } = await params

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

    // Check if category has any incomes
    const hasIncomes = await incomeCategoryService.hasIncomes(
      projectId,
      categoryId
    )

    if (hasIncomes) {
      return NextResponse.json(
        { error: 'این دسته‌بندی دارای درآمد است و نمی‌توان آن را حذف کرد' },
        { status: 400 }
      )
    }

    // Delete income category
    await incomeCategoryService.delete(projectId, categoryId)

    return NextResponse.json({ message: 'دسته‌بندی درآمد با موفقیت حذف شد' })
  } catch (error) {
    logApiError(error, {
      context:
        'DELETE /api/projects/[projectId]/income-categories/[categoryId]',
    })
    return NextResponse.json(
      { error: 'خطا در حذف دسته‌بندی درآمد' },
      { status: 500 }
    )
  }
}
