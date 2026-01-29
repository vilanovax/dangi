/**
 * Single Recurring Transaction API Routes
 * GET /api/projects/[projectId]/recurring/[id] - Get transaction details
 * PUT /api/projects/[projectId]/recurring/[id] - Update transaction
 * DELETE /api/projects/[projectId]/recurring/[id] - Delete transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectService } from '@/lib/services/project.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; id: string } }
) {
  try {
    const { projectId, id } = params

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

    const transaction = await prisma.recurringTransaction.findFirst({
      where: { id, projectId },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        project: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش تکراری پیدا نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error: any) {
    console.error('Error fetching recurring transaction:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت تراکنش تکراری', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; id: string } }
) {
  try {
    const { projectId, id } = params
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

    // Verify transaction exists
    const existingTransaction = await prisma.recurringTransaction.findFirst({
      where: { id, projectId },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'تراکنش تکراری پیدا نشد' },
        { status: 404 }
      )
    }

    // Validate fields if provided
    if (body.title !== undefined && body.title.trim() === '') {
      return NextResponse.json(
        { error: 'عنوان نمی‌تواند خالی باشد' },
        { status: 400 }
      )
    }

    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید بزرگتر از صفر باشد' },
        { status: 400 }
      )
    }

    if (body.frequency && !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(body.frequency)) {
      return NextResponse.json(
        { error: 'فرکانس نامعتبر است' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount)
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null
    }
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.participantId !== undefined) updateData.participantId = body.participantId
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const transaction = await prisma.recurringTransaction.update({
      where: { id },
      data: updateData,
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json({
      message: 'تراکنش تکراری با موفقیت به‌روزرسانی شد',
      transaction,
    })
  } catch (error: any) {
    console.error('Error updating recurring transaction:', error)
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی تراکنش تکراری', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; id: string } }
) {
  try {
    const { projectId, id } = params

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

    // Verify transaction exists
    const existingTransaction = await prisma.recurringTransaction.findFirst({
      where: { id, projectId },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'تراکنش تکراری پیدا نشد' },
        { status: 404 }
      )
    }

    await prisma.recurringTransaction.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'تراکنش تکراری با موفقیت حذف شد',
    })
  } catch (error: any) {
    console.error('Error deleting recurring transaction:', error)
    return NextResponse.json(
      { error: 'خطا در حذف تراکنش تکراری', details: error.message },
      { status: 500 }
    )
  }
}
