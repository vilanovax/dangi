/**
 * Toggle Recurring Transaction Active State
 * POST /api/projects/[projectId]/recurring/[id]/toggle - Toggle isActive
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectService } from '@/lib/services/project.service'

export async function POST(
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

    // Toggle isActive
    const transaction = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        isActive: !existingTransaction.isActive,
      },
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
      message: transaction.isActive
        ? 'تراکنش تکراری فعال شد'
        : 'تراکنش تکراری غیرفعال شد',
      transaction,
      isActive: transaction.isActive,
    })
  } catch (error: any) {
    console.error('Error toggling recurring transaction:', error)
    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت تراکنش', details: error.message },
      { status: 500 }
    )
  }
}
