import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{ projectId: string; categoryId: string }>
}

// DELETE /api/projects/[projectId]/categories/[categoryId] - Delete a category
// Note: This only affects project-level categories, not template defaults
// Expenses using this category will have categoryId set to null
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, categoryId } = await context.params

    // Check if category exists and belongs to project
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        projectId: projectId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      )
    }

    // Delete category (expenses will have null categoryId due to optional relation)
    await prisma.category.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'خطا در حذف دسته‌بندی' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[projectId]/categories/[categoryId] - Update a category
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, categoryId } = await context.params
    const body = await request.json()

    const { name, icon, color } = body

    // Check if category exists and belongs to project
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        projectId: projectId,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      )
    }

    // Update category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name: name.trim() }),
        ...(icon && { icon }),
        ...(color && { color }),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی دسته‌بندی' },
      { status: 500 }
    )
  }
}
