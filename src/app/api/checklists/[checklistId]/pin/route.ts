/**
 * Checklist Pin API
 * POST - Pin or unpin a checklist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  getChecklistById,
  pinChecklist,
} from '@/lib/services/checklist.service'

/**
 * POST /api/checklists/[checklistId]/pin
 * Pin or unpin checklist
 * Body: { pin: boolean }
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
    const { pin } = body

    if (typeof pin !== 'boolean') {
      return NextResponse.json(
        { error: 'مقدار pin باید boolean باشد' },
        { status: 400 }
      )
    }

    const result = await pinChecklist(resolvedParams.checklistId, user.id, pin)

    // Check for max pinned error
    if ('error' in result && result.error === 'MAX_PINNED') {
      return NextResponse.json(
        {
          error: 'MAX_PINNED',
          message: 'حداکثر ۳ چک‌لیست می‌تونی سنجاق کنی',
          pinnedCount: result.pinnedCount,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      checklist: result.checklist,
      message: pin ? 'به بالای لیست منتقل شد ⭐' : 'از سنجاق‌ها برداشته شد',
    })
  } catch (error: unknown) {
    console.error('Error pinning checklist:', error)
    return NextResponse.json(
      {
        error: 'خطا در سنجاق کردن چک‌لیست',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
