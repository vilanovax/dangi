import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; ruleId: string }>
}

/**
 * GET /api/projects/[projectId]/charge-rules/[ruleId]
 * دریافت یک قاعده شارژ
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, ruleId } = await context.params

    const chargeRule = await prisma.chargeRule.findFirst({
      where: {
        id: ruleId,
        projectId,
      },
    })

    if (!chargeRule) {
      return NextResponse.json(
        { error: 'قاعده شارژ یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({ chargeRule })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/charge-rules/[ruleId]' })
    return NextResponse.json(
      { error: 'خطا در دریافت قاعده شارژ' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[projectId]/charge-rules/[ruleId]
 * بروزرسانی قاعده شارژ
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, ruleId } = await context.params
    const body = await request.json()
    const { title, amount, frequency, splitType, isActive } = body

    // Check if charge rule exists
    const existing = await prisma.chargeRule.findFirst({
      where: {
        id: ruleId,
        projectId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'قاعده شارژ یافت نشد' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: {
      title?: string
      amount?: number
      frequency?: string
      splitType?: string
      isActive?: boolean
    } = {}

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { error: 'عنوان نمی‌تواند خالی باشد' },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }

    if (amount !== undefined) {
      const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: 'مبلغ باید عدد مثبت باشد' },
          { status: 400 }
        )
      }
      updateData.amount = parsedAmount
    }

    if (frequency !== undefined) {
      const validFrequencies = ['monthly', 'yearly']
      if (!validFrequencies.includes(frequency)) {
        return NextResponse.json(
          { error: 'نوع دوره نامعتبر است' },
          { status: 400 }
        )
      }
      updateData.frequency = frequency
    }

    if (splitType !== undefined) {
      const validSplitTypes = ['EQUAL', 'WEIGHTED', 'PERCENTAGE']
      if (!validSplitTypes.includes(splitType)) {
        return NextResponse.json(
          { error: 'نوع تقسیم نامعتبر است' },
          { status: 400 }
        )
      }
      updateData.splitType = splitType
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    const chargeRule = await prisma.chargeRule.update({
      where: { id: ruleId },
      data: updateData,
    })

    return NextResponse.json({ chargeRule })
  } catch (error) {
    logApiError(error, { context: 'PUT /api/projects/[projectId]/charge-rules/[ruleId]' })
    return NextResponse.json(
      { error: 'خطا در بروزرسانی قاعده شارژ' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId]/charge-rules/[ruleId]
 * حذف قاعده شارژ
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId, ruleId } = await context.params

    // Check if charge rule exists
    const existing = await prisma.chargeRule.findFirst({
      where: {
        id: ruleId,
        projectId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'قاعده شارژ یافت نشد' },
        { status: 404 }
      )
    }

    await prisma.chargeRule.delete({
      where: { id: ruleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError(error, { context: 'DELETE /api/projects/[projectId]/charge-rules/[ruleId]' })
    return NextResponse.json(
      { error: 'خطا در حذف قاعده شارژ' },
      { status: 500 }
    )
  }
}
