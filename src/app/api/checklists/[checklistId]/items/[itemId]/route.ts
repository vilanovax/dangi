/**
 * Single Checklist Item API
 * PATCH - Update item (text, note, isChecked, order)
 * DELETE - Delete item
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { prisma } from '@/lib/db/prisma'
import {
  updateChecklistItem,
  deleteChecklistItem,
} from '@/lib/services/checklist.service'
import type { UpdateChecklistItemInput } from '@/types/checklist'

/**
 * Helper function to verify item ownership via checklist
 */
async function verifyItemOwnership(itemId: string, userId: string) {
  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    include: {
      checklist: {
        select: { userId: true },
      },
    },
  })

  if (!item) {
    return { error: 'آیتم یافت نشد', status: 404 }
  }

  if (item.checklist.userId !== userId) {
    return { error: 'دسترسی غیرمجاز', status: 403 }
  }

  return { item }
}

/**
 * PATCH /api/checklists/[checklistId]/items/[itemId]
 * Update item (text, note, isChecked, order)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string; itemId: string }> }
) {
  try {
    const resolvedParams = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 })
    }

    // Verify ownership
    const verification = await verifyItemOwnership(resolvedParams.itemId, user.id)
    if ('error' in verification) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }

    const body = await request.json()
    const input: UpdateChecklistItemInput = {
      text: body.text,
      note: body.note,
      isChecked: body.isChecked,
      order: body.order,
    }

    const updatedItem = await updateChecklistItem(resolvedParams.itemId, input)

    return NextResponse.json({ item: updatedItem })
  } catch (error: unknown) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      {
        error: 'خطا در به‌روزرسانی آیتم',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/checklists/[checklistId]/items/[itemId]
 * Delete item permanently
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string; itemId: string }> }
) {
  try {
    const resolvedParams = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 })
    }

    // Verify ownership
    const verification = await verifyItemOwnership(resolvedParams.itemId, user.id)
    if ('error' in verification) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }

    await deleteChecklistItem(resolvedParams.itemId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting checklist item:', error)
    return NextResponse.json(
      {
        error: 'خطا در حذف آیتم',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
