import { NextRequest, NextResponse } from 'next/server'
import { getShoppingItems, createShoppingItem } from '@/lib/services/shopping.service'

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

    const result = await getShoppingItems(projectId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching shopping items:', error)
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
    const body = await request.json()

    const { text, quantity, note, addedById } = body

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
      addedById: addedById || undefined,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating shopping item:', error)
    return NextResponse.json(
      { error: 'خطا در افزودن آیتم' },
      { status: 500 }
    )
  }
}
