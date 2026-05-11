import { NextRequest, NextResponse } from 'next/server'
import { getShoppingItems, createShoppingItem } from '@/lib/services/shopping.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import { isAppError } from '@/lib/errors'

/**
 * GET /api/projects/[projectId]/shopping-items
 * Get all shopping items for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const result = await getShoppingItems(projectId)

    return NextResponse.json(result)
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/shopping-items' })
    return NextResponse.json(
      { error: 'خطا در بارگذاری لیست خرید' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/shopping-items
 * Create a new shopping item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Authorization check: user must be a participant
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()

    const { text, quantity, note, assignedToId } = body

    // Validation
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'متن آیتم الزامی است' },
        { status: 400 }
      )
    }

    if (text.trim().length > 200) {
      return NextResponse.json(
        { error: 'متن آیتم نباید بیشتر از ۲۰۰ کاراکتر باشد' },
        { status: 400 }
      )
    }

    const item = await createShoppingItem(projectId, {
      text: text.trim(),
      quantity: quantity?.trim() || undefined,
      note: note?.trim() || undefined,
      addedById: authResult.participant.id,
      assignedToId: assignedToId || undefined,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    logApiError(error, { context: 'POST /api/projects/[projectId]/shopping-items' })
    return NextResponse.json(
      { error: 'خطا در افزودن آیتم' },
      { status: 500 }
    )
  }
}
