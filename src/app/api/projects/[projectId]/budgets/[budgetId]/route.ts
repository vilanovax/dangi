import { NextRequest, NextResponse } from 'next/server'
import { getProjectById } from '@/lib/services/project.service'
import { budgetService } from '@/lib/services/budget.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { UpdateBudgetInput } from '@/types/family'

interface RouteParams {
  params: Promise<{ projectId: string; budgetId: string }>
}

// GET /api/projects/[projectId]/budgets/[budgetId] - Get a single budget
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, budgetId } = await params

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

    // Get budget
    const budget = await budgetService.getById(projectId, budgetId)

    if (!budget) {
      return NextResponse.json({ error: 'بودجه یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ budget })
  } catch (error) {
    logApiError(error, {
      context: 'GET /api/projects/[projectId]/budgets/[budgetId]',
    })
    return NextResponse.json({ error: 'خطا در دریافت بودجه' }, { status: 500 })
  }
}

// PUT /api/projects/[projectId]/budgets/[budgetId] - Update a budget
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, budgetId } = await params

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

    // Validate amount if provided
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return NextResponse.json(
          { error: 'مبلغ بودجه باید عدد مثبت باشد' },
          { status: 400 }
        )
      }
    }

    // Create update data
    const updateData: UpdateBudgetInput = {}
    if (body.amount !== undefined) {
      updateData.amount = body.amount
    }

    // Update budget
    const budget = await budgetService.update(projectId, budgetId, updateData)

    return NextResponse.json({ budget })
  } catch (error) {
    logApiError(error, {
      context: 'PUT /api/projects/[projectId]/budgets/[budgetId]',
    })
    return NextResponse.json({ error: 'خطا در ویرایش بودجه' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/budgets/[budgetId] - Delete a budget
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, budgetId } = await params

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

    // Delete budget
    await budgetService.delete(projectId, budgetId)

    return NextResponse.json({ message: 'بودجه با موفقیت حذف شد' })
  } catch (error) {
    logApiError(error, {
      context: 'DELETE /api/projects/[projectId]/budgets/[budgetId]',
    })
    return NextResponse.json({ error: 'خطا در حذف بودجه' }, { status: 500 })
  }
}
