/**
 * Checklists API
 * GET - List user's checklists with optional filters
 * POST - Create new checklist (from template or blank)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  getUserChecklists,
  createChecklist,
  createChecklistFromTemplate,
} from '@/lib/services/checklist.service'
import type {
  CreateChecklistInput,
  CreateChecklistFromTemplateInput,
} from '@/types/checklist'

/**
 * GET /api/checklists
 * List user's checklists with optional filters
 * Query params: category, includeArchived
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const checklists = await getUserChecklists(user.id, {
      category: category as 'travel' | 'gathering' | 'personal-finance' | undefined,
      includeArchived,
    })

    return NextResponse.json({ checklists })
  } catch (error: unknown) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json(
      {
        error: 'خطا در دریافت چک‌لیست‌ها',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/checklists
 * Create new checklist (from template or blank)
 * Body: { templateId } OR { title, category, icon?, color?, description? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت لازم است' }, { status: 401 })
    }

    const body = await request.json()

    // Check if creating from template
    if (body.templateId) {
      const input: CreateChecklistFromTemplateInput = {
        templateId: body.templateId,
        customTitle: body.customTitle,
      }

      const checklist = await createChecklistFromTemplate(user.id, input)
      return NextResponse.json({ checklist }, { status: 201 })
    }

    // Otherwise, create blank checklist
    const input: CreateChecklistInput = {
      title: body.title,
      category: body.category,
      icon: body.icon,
      color: body.color,
      description: body.description,
    }

    // Validate required fields
    if (!input.title || !input.category) {
      return NextResponse.json(
        { error: 'عنوان و دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    const checklist = await createChecklist(user.id, input)
    return NextResponse.json({ checklist }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating checklist:', error)
    return NextResponse.json(
      {
        error: 'خطا در ایجاد چک‌لیست',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
