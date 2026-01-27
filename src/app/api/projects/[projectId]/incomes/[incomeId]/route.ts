import { NextRequest, NextResponse } from 'next/server'
import { incomeService } from '@/lib/services/income.service'
import { getProjectById } from '@/lib/services/project.service'
import { requireProjectAccess } from '@/lib/utils/auth'
import { logApiError } from '@/lib/utils/logger'
import type { UpdateIncomeInput } from '@/types/family'

interface RouteParams {
  params: Promise<{ projectId: string; incomeId: string }>
}

// GET /api/projects/[projectId]/incomes/[incomeId] - Get a single income
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, incomeId } = await params

    // Authorization check
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    const income = await incomeService.getById(projectId, incomeId)

    if (!income) {
      return NextResponse.json({ error: 'درآمد یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ income })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/incomes/[incomeId]' })
    return NextResponse.json({ error: 'خطا در دریافت درآمد' }, { status: 500 })
  }
}

// PUT /api/projects/[projectId]/incomes/[incomeId] - Update an income
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, incomeId } = await params

    // Authorization check
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if income exists
    const existingIncome = await incomeService.getById(projectId, incomeId)
    if (!existingIncome) {
      return NextResponse.json({ error: 'درآمد یافت نشد' }, { status: 404 })
    }

    const body = await request.json()

    // Validation
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json({ error: 'عنوان درآمد نامعتبر است' }, { status: 400 })
      }
    }

    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return NextResponse.json({ error: 'مبلغ باید عدد مثبت باشد' }, { status: 400 })
      }
    }

    const updateData: UpdateIncomeInput = {}

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.description !== undefined) updateData.description = body.description
    if (body.source !== undefined) updateData.source = body.source
    if (body.incomeDate !== undefined) updateData.incomeDate = body.incomeDate
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.receivedById !== undefined) updateData.receivedById = body.receivedById
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring
    if (body.recurringId !== undefined) updateData.recurringId = body.recurringId

    const income = await incomeService.update(projectId, incomeId, updateData)

    return NextResponse.json({ income })
  } catch (error) {
    logApiError(error, { context: 'PUT /api/projects/[projectId]/incomes/[incomeId]' })
    return NextResponse.json({ error: 'خطا در ویرایش درآمد' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/incomes/[incomeId] - Delete an income
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, incomeId } = await params

    // Authorization check
    const authResult = await requireProjectAccess(projectId)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if income exists
    const existingIncome = await incomeService.getById(projectId, incomeId)
    if (!existingIncome) {
      return NextResponse.json({ error: 'درآمد یافت نشد' }, { status: 404 })
    }

    await incomeService.delete(projectId, incomeId)

    return NextResponse.json({ message: 'درآمد حذف شد' })
  } catch (error) {
    logApiError(error, { context: 'DELETE /api/projects/[projectId]/incomes/[incomeId]' })
    return NextResponse.json({ error: 'خطا در حذف درآمد' }, { status: 500 })
  }
}
