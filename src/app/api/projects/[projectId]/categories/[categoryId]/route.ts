import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; categoryId: string }>
}

// PUT /api/projects/[projectId]/categories/[categoryId] - Update category
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, categoryId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()
    const { name, icon, color } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to project
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category || category.projectId !== projectId) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      )
    }

    // Check for duplicate name in project (excluding current category)
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    const duplicateCategory = project.categories.find(
      (c) => c.id !== categoryId && c.name.toLowerCase() === name.trim().toLowerCase()
    )
    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی با این نام قبلاً وجود دارد' },
        { status: 400 }
      )
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        icon: icon || category.icon,
        color: color || category.color,
      },
    })

    return NextResponse.json({ category: updatedCategory })
  } catch (error) {
    logApiError(error, { context: 'PUT /api/projects/[projectId]/categories/[categoryId]' })
    return NextResponse.json(
      { error: 'خطا در ویرایش دسته‌بندی' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[projectId]/categories/[categoryId] - Delete category
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, categoryId } = await context.params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if category exists and belongs to project
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        expenses: { take: 1 },
        budgets: { take: 1 },
      },
    })

    if (!category || category.projectId !== projectId) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      )
    }

    // Check if category is in use
    if (category.expenses.length > 0 || category.budgets.length > 0) {
      return NextResponse.json(
        { error: 'این دسته‌بندی در حال استفاده است و نمی‌توان آن را حذف کرد' },
        { status: 400 }
      )
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, { context: 'DELETE /api/projects/[projectId]/categories/[categoryId]' })
    return NextResponse.json(
      { error: 'خطا در حذف دسته‌بندی' },
      { status: 500 }
    )
  }
}
