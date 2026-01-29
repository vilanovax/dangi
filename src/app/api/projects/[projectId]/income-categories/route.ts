/**
 * Income Categories API Routes
 * GET /api/projects/[projectId]/income-categories - List all income categories
 * POST /api/projects/[projectId]/income-categories - Create a new income category
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectService } from '@/lib/services/project.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

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

    const categories = await prisma.incomeCategory.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error fetching income categories:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی‌های درآمد', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
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

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    const category = await prisma.incomeCategory.create({
      data: {
        name: body.name.trim(),
        icon: body.icon,
        color: body.color,
        projectId,
      },
    })

    return NextResponse.json(
      {
        message: 'دسته‌بندی با موفقیت ایجاد شد',
        category,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating income category:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد دسته‌بندی', details: error.message },
      { status: 500 }
    )
  }
}
