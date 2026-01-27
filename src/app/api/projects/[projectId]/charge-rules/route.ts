import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getTemplate } from '@/lib/domain/templates'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

/**
 * GET /api/projects/[projectId]/charge-rules
 * دریافت لیست قواعد شارژ پروژه
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params

    // Check if project exists and supports charge rules
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, template: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    const template = getTemplate(project.template)
    if (!template.supportsChargeRules) {
      return NextResponse.json(
        { error: 'این نوع پروژه از قواعد شارژ پشتیبانی نمی‌کند' },
        { status: 400 }
      )
    }

    const chargeRules = await prisma.chargeRule.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ chargeRules })
  } catch (error) {
    logApiError(error, { context: 'GET /api/projects/[projectId]/charge-rules' })
    return NextResponse.json(
      { error: 'خطا در دریافت قواعد شارژ' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/charge-rules
 * ایجاد قاعده شارژ جدید
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { projectId } = await context.params
    const body = await request.json()
    const { title, amount, frequency, splitType } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'عنوان الزامی است' },
        { status: 400 }
      )
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید عدد مثبت باشد' },
        { status: 400 }
      )
    }

    // Check if project exists and supports charge rules
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, template: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      )
    }

    const template = getTemplate(project.template)
    if (!template.supportsChargeRules) {
      return NextResponse.json(
        { error: 'این نوع پروژه از قواعد شارژ پشتیبانی نمی‌کند' },
        { status: 400 }
      )
    }

    // Validate frequency
    const validFrequencies = ['monthly', 'yearly']
    const finalFrequency = frequency && validFrequencies.includes(frequency)
      ? frequency
      : 'monthly'

    // Validate splitType
    const validSplitTypes = ['EQUAL', 'WEIGHTED', 'PERCENTAGE']
    const finalSplitType = splitType && validSplitTypes.includes(splitType)
      ? splitType
      : 'WEIGHTED'

    const chargeRule = await prisma.chargeRule.create({
      data: {
        title: title.trim(),
        amount: parsedAmount,
        frequency: finalFrequency,
        splitType: finalSplitType,
        projectId,
      },
    })

    return NextResponse.json({ chargeRule }, { status: 201 })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/charge-rules' })
    return NextResponse.json(
      { error: 'خطا در ایجاد قاعده شارژ' },
      { status: 500 }
    )
  }
}
