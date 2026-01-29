/**
 * Single Budget API Routes
 * PUT /api/projects/[projectId]/budgets/[budgetId] - Update budget
 * DELETE /api/projects/[projectId]/budgets/[budgetId] - Delete budget
 */

import { NextRequest, NextResponse } from 'next/server'
import { budgetService } from '@/lib/services/budget.service'
import { projectService } from '@/lib/services/project.service'
import type { UpdateBudgetInput } from '@/types/family'

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; budgetId: string } }
) {
  try {
    const { projectId, budgetId } = params
    const body = await request.json()

    // Verify project exists
    const project = await projectService.getById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه پیدا نشد' }, { status: 404 })
    }

    // Verify project is family template
    if (project.template !== 'family') {
      return NextResponse.json(
        { error: 'این ویژگی فقط برای تمپلیت خانواده در دسترس است' },
        { status: 400 }
      )
    }

    // Verify budget exists
    const existingBudget = await budgetService.getById(projectId, budgetId)
    if (!existingBudget) {
      return NextResponse.json({ error: 'بودجه پیدا نشد' }, { status: 404 })
    }

    // Validate amount if provided
    if (body.amount !== undefined && body.amount < 0) {
      return NextResponse.json(
        { error: 'مبلغ بودجه نمی‌تواند منفی باشد' },
        { status: 400 }
      )
    }

    const updateData: UpdateBudgetInput = {}
    if (body.amount !== undefined) {
      updateData.amount = parseFloat(body.amount)
    }

    const budget = await budgetService.update(projectId, budgetId, updateData)

    return NextResponse.json({
      message: 'بودجه با موفقیت به‌روزرسانی شد',
      budget,
    })
  } catch (error: any) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی بودجه', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; budgetId: string } }
) {
  try {
    const { projectId, budgetId } = params

    // Verify project exists
    const project = await projectService.getById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'پروژه پیدا نشد' }, { status: 404 })
    }

    // Verify project is family template
    if (project.template !== 'family') {
      return NextResponse.json(
        { error: 'این ویژگی فقط برای تمپلیت خانواده در دسترس است' },
        { status: 400 }
      )
    }

    // Verify budget exists
    const existingBudget = await budgetService.getById(projectId, budgetId)
    if (!existingBudget) {
      return NextResponse.json({ error: 'بودجه پیدا نشد' }, { status: 404 })
    }

    await budgetService.delete(projectId, budgetId)

    return NextResponse.json({
      message: 'بودجه با موفقیت حذف شد',
    })
  } catch (error: any) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'خطا در حذف بودجه', details: error.message },
      { status: 500 }
    )
  }
}
