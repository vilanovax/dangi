/**
 * Checklist Items API
 * POST - Create new item in checklist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  getChecklistById,
  createChecklistItem,
} from '@/lib/services/checklist.service'
import type { CreateChecklistItemInput } from '@/types/checklist'

/**
 * POST /api/checklists/[checklistId]/items
 * Create new item in checklist
 */
export async function POST(
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
    const input: CreateChecklistItemInput = {
      text: body.text,
      note: body.note,
      order: body.order,
    }

    // Validate required fields
    if (!input.text) {
      return NextResponse.json({ error: 'متن آیتم الزامی است' }, { status: 400 })
    }

    const item = await createChecklistItem(resolvedParams.checklistId, input)

    return NextResponse.json({ item }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating checklist item:', error)
    return NextResponse.json(
      {
        error: 'خطا در ایجاد آیتم',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
