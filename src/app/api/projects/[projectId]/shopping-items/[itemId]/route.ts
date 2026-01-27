import { NextRequest, NextResponse } from 'next/server'
import { updateShoppingItem, deleteShoppingItem } from '@/lib/services/shopping.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'

/**
 * PATCH /api/projects/[projectId]/shopping-items/[itemId]
 * Update a shopping item (toggle check, edit text, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
) {
  try {
    const { projectId, itemId } = await params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()

    const { text, isChecked, quantity, note } = body

    // Validation
    if (text !== undefined) {
      if (typeof text !== 'string' || !text.trim()) {
        return NextResponse.json(
          { error: 'متن آیتم نمی‌تواند خالی باشد' },
          { status: 400 }
        )
      }

      if (text.trim().length > 200) {
        return NextResponse.json(
          { error: 'متن آیتم نباید بیشتر از ۲۰۰ کاراکتر باشد' },
          { status: 400 }
        )
      }
    }

    if (isChecked !== undefined && typeof isChecked !== 'boolean') {
      return NextResponse.json(
        { error: 'مقدار isChecked باید boolean باشد' },
        { status: 400 }
      )
    }

    const item = await updateShoppingItem(itemId, {
      text: text?.trim(),
      isChecked,
      quantity: quantity?.trim() || undefined,
      note: note?.trim() || undefined,
    })

    return NextResponse.json({ item })
  } catch (error) {
    logApiError(error, { context: 'PATCH /api/projects/[projectId]/shopping-items/[itemId]' })
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی آیتم' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId]/shopping-items/[itemId]
 * Delete a shopping item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
) {
  try {
    const { projectId, itemId } = await params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    await deleteShoppingItem(itemId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, { context: 'DELETE /api/projects/[projectId]/shopping-items/[itemId]' })
    return NextResponse.json(
      { error: 'خطا در حذف آیتم' },
      { status: 500 }
    )
  }
}
