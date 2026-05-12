/**
 * Save Checklist as Template API
 * POST /api/checklists/[checklistId]/save-template
 * Saves a checklist as a reusable template
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/utils/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'غیرمجاز - لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const { checklistId } = await params
    const body = await req.json()
    const { category } = body

    // Find the checklist
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: { items: true }
    })

    if (!checklist) {
      return NextResponse.json(
        { error: 'چک‌لیست یافت نشد' },
        { status: 404 }
      )
    }

    // Check ownership
    if (checklist.userId !== user.id) {
      return NextResponse.json(
        { error: 'شما مالک این چک‌لیست نیستید' },
        { status: 403 }
      )
    }

    // Create a reusable copy of the checklist.
    // Reset all items to unchecked
    const templateItems = checklist.items.map(item => ({
      text: item.text,
      note: item.note,
      order: item.order,
      isChecked: false // Reset to unchecked
    }))

    const template = await prisma.checklist.create({
      data: {
        title: checklist.title,
        description: checklist.description,
        category: category || checklist.category,
        icon: checklist.icon,
        color: checklist.color,
        userId: user.id,
        items: {
          create: templateItems
        }
      },
      include: { items: true }
    })

    return NextResponse.json({
      message: 'چک‌لیست با موفقیت به عنوان تمپلیت ذخیره شد',
      template
    })
  } catch (error: unknown) {
    console.error('Error saving checklist as template:', error)
    return NextResponse.json(
      {
        error: 'خطا در ذخیره تمپلیت',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
