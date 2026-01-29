/**
 * Single Income API Routes
 * GET /api/projects/[projectId]/incomes/[incomeId] - Get income details
 * PUT /api/projects/[projectId]/incomes/[incomeId] - Update income
 * DELETE /api/projects/[projectId]/incomes/[incomeId] - Delete income
 */

import { NextRequest, NextResponse } from 'next/server'
import { incomeService } from '@/lib/services/income.service'
import { projectService } from '@/lib/services/project.service'
import type { UpdateIncomeInput } from '@/types/family'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; incomeId: string }> }
) {
  try {
    const { projectId, incomeId } = await params

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

    const income = await incomeService.getById(projectId, incomeId)

    if (!income) {
      return NextResponse.json({ error: 'درآمد پیدا نشد' }, { status: 404 })
    }

    return NextResponse.json({ income })
  } catch (error: any) {
    console.error('Error fetching income:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات درآمد', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; incomeId: string }> }
) {
  try {
    const { projectId, incomeId } = await params
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

    // Verify income exists
    const existingIncome = await incomeService.getById(projectId, incomeId)
    if (!existingIncome) {
      return NextResponse.json({ error: 'درآمد پیدا نشد' }, { status: 404 })
    }

    // Validate fields if provided
    if (body.title !== undefined && body.title.trim() === '') {
      return NextResponse.json(
        { error: 'عنوان درآمد نمی‌تواند خالی باشد' },
        { status: 400 }
      )
    }

    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید بزرگتر از صفر باشد' },
        { status: 400 }
      )
    }

    // If receivedById is being updated, verify the participant
    if (body.receivedById) {
      const participant = await projectService.getParticipant(
        projectId,
        body.receivedById
      )
      if (!participant) {
        return NextResponse.json(
          { error: 'دریافت‌کننده در این پروژه وجود ندارد' },
          { status: 404 }
        )
      }
    }

    const updateData: UpdateIncomeInput = {}

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount)
    if (body.description !== undefined) updateData.description = body.description?.trim()
    if (body.source !== undefined) updateData.source = body.source?.trim()
    if (body.incomeDate !== undefined) updateData.incomeDate = body.incomeDate
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.receivedById !== undefined) updateData.receivedById = body.receivedById
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring
    if (body.recurringId !== undefined) updateData.recurringId = body.recurringId

    const updatedIncome = await incomeService.update(
      projectId,
      incomeId,
      updateData
    )

    return NextResponse.json({
      message: 'درآمد با موفقیت به‌روزرسانی شد',
      income: updatedIncome,
    })
  } catch (error: any) {
    console.error('Error updating income:', error)
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی درآمد', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; incomeId: string }> }
) {
  try {
    const { projectId, incomeId } = await params

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

    // Verify income exists
    const existingIncome = await incomeService.getById(projectId, incomeId)
    if (!existingIncome) {
      return NextResponse.json({ error: 'درآمد پیدا نشد' }, { status: 404 })
    }

    await incomeService.delete(projectId, incomeId)

    return NextResponse.json({
      message: 'درآمد با موفقیت حذف شد',
    })
  } catch (error: any) {
    console.error('Error deleting income:', error)
    return NextResponse.json(
      { error: 'خطا در حذف درآمد', details: error.message },
      { status: 500 }
    )
  }
}
