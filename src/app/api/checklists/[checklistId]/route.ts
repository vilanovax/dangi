/**
 * Single Checklist API
 * GET - Get checklist with items
 * PATCH - Update checklist metadata
 * DELETE - Delete checklist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  getChecklistById,
  updateChecklist,
  deleteChecklist,
} from '@/lib/services/checklist.service'
import type { UpdateChecklistInput } from '@/types/checklist'

/**
 * GET /api/checklists/[checklistId]
 * Get checklist with all items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  try {
    const resolvedParams = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 })
    }

    const checklist = await getChecklistById(resolvedParams.checklistId)

    if (!checklist) {
      return NextResponse.json({ error: 'چک‌لیست یافت نشد' }, { status: 404 })
    }

    // Verify ownership
    if (checklist.userId !== user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    return NextResponse.json({ checklist })
  } catch (error: unknown) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      {
        error: 'خطا در دریافت چک‌لیست',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/checklists/[checklistId]
 * Update checklist metadata (title, description, icon, color)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  try {
    const resolvedParams = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 })
    }

    const checklist = await getChecklistById(resolvedParams.checklistId)

    if (!checklist) {
      return NextResponse.json({ error: 'چک‌لیست یافت نشد' }, { status: 404 })
    }

    // Verify ownership
    if (checklist.userId !== user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const input: UpdateChecklistInput = {
      title: body.title,
      description: body.description,
      icon: body.icon,
      color: body.color,
    }

    const updatedChecklist = await updateChecklist(resolvedParams.checklistId, input)

    return NextResponse.json({ checklist: updatedChecklist })
  } catch (error: unknown) {
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      {
        error: 'خطا در به‌روزرسانی چک‌لیست',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/checklists/[checklistId]
 * Delete checklist permanently
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  try {
    const resolvedParams = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 })
    }

    const checklist = await getChecklistById(resolvedParams.checklistId)

    if (!checklist) {
      return NextResponse.json({ error: 'چک‌لیست یافت نشد' }, { status: 404 })
    }

    // Verify ownership
    if (checklist.userId !== user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    await deleteChecklist(resolvedParams.checklistId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting checklist:', error)
    return NextResponse.json(
      {
        error: 'خطا در حذف چک‌لیست',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
