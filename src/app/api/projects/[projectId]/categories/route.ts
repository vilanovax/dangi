import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getProjectById } from '@/lib/services/project.service'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/categories - Get all categories
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

    return NextResponse.json({ categories: project.categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی‌ها' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/categories - Create a new category
// Note: This creates a PROJECT-LEVEL category, NOT a template category
// Template categories remain unchanged
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params
    const body = await request.json()

    const { name, icon, color } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    // Check for duplicate name in project
    const existingCategory = project.categories.find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    )
    if (existingCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی با این نام قبلاً وجود دارد' },
        { status: 400 }
      )
    }

    // Create new project-level category
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || '📝',
        color: color || '#6B7280',
        projectId,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد دسته‌بندی' },
      { status: 500 }
    )
  }
}
