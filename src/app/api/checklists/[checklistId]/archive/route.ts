/**
 * Checklist Archive API
 * POST - Archive or unarchive a checklist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  getChecklistById,
  archiveChecklist,
} from '@/lib/services/checklist.service'

/**
 * POST /api/checklists/[checklistId]/archive
 * Archive or unarchive checklist
 * Body: { archive: boolean }
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
    const { archive } = body

    if (typeof archive !== 'boolean') {
      return NextResponse.json(
        { error: 'مقدار archive باید boolean باشد' },
        { status: 400 }
      )
    }

    const updatedChecklist = await archiveChecklist(resolvedParams.checklistId, archive)

    return NextResponse.json({
      checklist: updatedChecklist,
      message: archive ? 'چک‌لیست آرشیو شد' : 'چک‌لیست از آرشیو خارج شد',
    })
  } catch (error: unknown) {
    console.error('Error archiving checklist:', error)
    return NextResponse.json(
      {
        error: 'خطا در آرشیو کردن چک‌لیست',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
