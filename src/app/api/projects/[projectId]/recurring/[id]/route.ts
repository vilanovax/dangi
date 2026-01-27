import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getProjectById } from '@/lib/services/project.service'
import { recurringService } from '@/lib/services/recurring.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { UpdateRecurringTransactionInput } from '@/types/family'

interface RouteParams {
  params: Promise<{ projectId: string; id: string }>
}

// GET /api/projects/[projectId]/recurring/[id] - Get a single recurring transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, id } = await params

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

    // Get recurring transaction
    const recurring = await recurringService.getById(projectId, id)

    if (!recurring) {
      return NextResponse.json(
        { error: 'تراکنش تکراری یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ recurring })
  } catch (error) {
    logApiError(error, {
      context: 'GET /api/projects/[projectId]/recurring/[id]',
    })
    return NextResponse.json(
      { error: 'خطا در دریافت تراکنش تکراری' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[projectId]/recurring/[id] - Update a recurring transaction
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, id } = await params

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

    // Note: Type cannot be changed after creation (INCOME/EXPENSE)
    // If user tries to change type, return error
    if (body.type !== undefined) {
      return NextResponse.json(
        { error: 'نوع تراکنش (INCOME/EXPENSE) قابل تغییر نیست' },
        { status: 400 }
      )
    }

    // Validate title if provided
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'عنوان نمی‌تواند خالی باشد' },
          { status: 400 }
        )
      }
    }

    // Validate amount if provided
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return NextResponse.json(
          { error: 'مبلغ باید عدد مثبت باشد' },
          { status: 400 }
        )
      }
    }

    // Validate frequency if provided
    if (body.frequency !== undefined) {
      if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(body.frequency)) {
        return NextResponse.json(
          { error: 'فرکانس باید DAILY، WEEKLY، MONTHLY یا YEARLY باشد' },
          { status: 400 }
        )
      }
    }

    // Verify participant if provided
    if (body.participantId) {
      const participant = await prisma.participant.findFirst({
        where: {
          id: body.participantId,
          projectId,
        },
      })

      if (!participant) {
        return NextResponse.json(
          { error: 'شرکت‌کننده یافت نشد یا به این پروژه تعلق ندارد' },
          { status: 404 }
        )
      }
    }

    // Verify category if provided
    if (body.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: body.categoryId,
          projectId,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'دسته‌بندی یافت نشد یا به این پروژه تعلق ندارد' },
          { status: 404 }
        )
      }
    }

    // Create update data
    const updateData: UpdateRecurringTransactionInput = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.participantId !== undefined)
      updateData.participantId = body.participantId
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    // Update recurring transaction
    const recurring = await recurringService.update(projectId, id, updateData)

    return NextResponse.json({ recurring })
  } catch (error) {
    logApiError(error, {
      context: 'PUT /api/projects/[projectId]/recurring/[id]',
    })
    return NextResponse.json(
      { error: 'خطا در ویرایش تراکنش تکراری' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[projectId]/recurring/[id] - Delete a recurring transaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, id } = await params

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

    // Delete recurring transaction
    await recurringService.delete(projectId, id)

    return NextResponse.json({ message: 'تراکنش تکراری با موفقیت حذف شد' })
  } catch (error) {
    logApiError(error, {
      context: 'DELETE /api/projects/[projectId]/recurring/[id]',
    })
    return NextResponse.json(
      { error: 'خطا در حذف تراکنش تکراری' },
      { status: 500 }
    )
  }
}
