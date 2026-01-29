/**
 * Single Income Category API Routes
 * PUT /api/projects/[projectId]/income-categories/[categoryId] - Update category
 * DELETE /api/projects/[projectId]/income-categories/[categoryId] - Delete category
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectService } from '@/lib/services/project.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; categoryId: string }> }
) {
  try {
    const { projectId, categoryId } = await params
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

    // Verify category exists
    const existingCategory = await prisma.incomeCategory.findFirst({
      where: { id: categoryId, projectId },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی پیدا نشد' },
        { status: 404 }
      )
    }

    // Validate if name is being updated
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json(
        { error: 'نام دسته‌بندی نمی‌تواند خالی باشد' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color

    const category = await prisma.incomeCategory.update({
      where: { id: categoryId },
      data: updateData,
    })

    return NextResponse.json({
      message: 'دسته‌بندی با موفقیت به‌روزرسانی شد',
      category,
    })
  } catch (error: any) {
    console.error('Error updating income category:', error)
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی دسته‌بندی', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; categoryId: string }> }
) {
  try {
    const { projectId, categoryId } = await params

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

    // Verify category exists
    const existingCategory = await prisma.incomeCategory.findFirst({
      where: { id: categoryId, projectId },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی پیدا نشد' },
        { status: 404 }
      )
    }

    // Check if category is being used
    const incomeCount = await prisma.income.count({
      where: { categoryId },
    })

    if (incomeCount > 0) {
      return NextResponse.json(
        { 
          error: `این دسته‌بندی در ${incomeCount} درآمد استفاده شده و قابل حذف نیست`,
          incomeCount 
        },
        { status: 400 }
      )
    }

    await prisma.incomeCategory.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({
      message: 'دسته‌بندی با موفقیت حذف شد',
    })
  } catch (error: any) {
    console.error('Error deleting income category:', error)
    return NextResponse.json(
      { error: 'خطا در حذف دسته‌بندی', details: error.message },
      { status: 500 }
    )
  }
}
