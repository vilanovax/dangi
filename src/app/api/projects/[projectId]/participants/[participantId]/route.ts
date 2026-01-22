import { NextRequest, NextResponse } from 'next/server'
import {
  getParticipantById,
  updateParticipant,
  deleteParticipant,
} from '@/lib/services/participant.service'

type RouteContext = {
  params: Promise<{ projectId: string; participantId: string }>
}

// GET /api/projects/[projectId]/participants/[participantId]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, participantId } = await context.params

    const participant = await getParticipantById(participantId)

    if (!participant) {
      return NextResponse.json({ error: 'عضو یافت نشد' }, { status: 404 })
    }

    if (participant.projectId !== projectId) {
      return NextResponse.json(
        { error: 'عضو متعلق به این پروژه نیست' },
        { status: 403 }
      )
    }

    return NextResponse.json({ participant })
  } catch (error) {
    console.error('Error fetching participant:', error)
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات عضو' }, { status: 500 })
  }
}

// PATCH /api/projects/[projectId]/participants/[participantId]
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, participantId } = await context.params

    const existingParticipant = await getParticipantById(participantId)

    if (!existingParticipant) {
      return NextResponse.json({ error: 'عضو یافت نشد' }, { status: 404 })
    }

    if (existingParticipant.projectId !== projectId) {
      return NextResponse.json(
        { error: 'عضو متعلق به این پروژه نیست' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, weight, percentage, avatar } = body

    // Validation
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'نام نامعتبر است' }, { status: 400 })
    }

    if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
      return NextResponse.json({ error: 'وزن باید عدد مثبت باشد' }, { status: 400 })
    }

    if (percentage !== undefined && (typeof percentage !== 'number' || percentage < 0 || percentage > 100)) {
      return NextResponse.json({ error: 'درصد باید بین ۰ تا ۱۰۰ باشد' }, { status: 400 })
    }

    const updateData: {
      name?: string
      weight?: number
      percentage?: number
      avatar?: string | null
    } = {}

    if (name !== undefined) updateData.name = name.trim()
    if (weight !== undefined) updateData.weight = weight
    if (percentage !== undefined) updateData.percentage = percentage
    if (avatar !== undefined) updateData.avatar = avatar

    const participant = await updateParticipant(participantId, updateData)

    return NextResponse.json({ participant })
  } catch (error) {
    console.error('Error updating participant:', error)
    return NextResponse.json({ error: 'خطا در ویرایش عضو' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/participants/[participantId]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, participantId } = await context.params

    const existingParticipant = await getParticipantById(participantId)

    if (!existingParticipant) {
      return NextResponse.json({ error: 'عضو یافت نشد' }, { status: 404 })
    }

    if (existingParticipant.projectId !== projectId) {
      return NextResponse.json(
        { error: 'عضو متعلق به این پروژه نیست' },
        { status: 403 }
      )
    }

    // Cannot delete owner
    if (existingParticipant.role === 'OWNER') {
      return NextResponse.json(
        { error: 'نمی‌توان مالک پروژه را حذف کرد' },
        { status: 400 }
      )
    }

    await deleteParticipant(participantId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting participant:', error)

    // Handle specific errors
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage === 'PARTICIPANT_HAS_EXPENSES') {
      return NextResponse.json(
        { error: 'این عضو هزینه‌هایی پرداخت کرده است و نمی‌توان حذفش کرد' },
        { status: 400 }
      )
    }
    if (errorMessage === 'PARTICIPANT_HAS_SHARES') {
      return NextResponse.json(
        { error: 'این عضو در تقسیم هزینه‌ها شرکت دارد و نمی‌توان حذفش کرد' },
        { status: 400 }
      )
    }
    if (errorMessage === 'PARTICIPANT_HAS_SETTLEMENTS') {
      return NextResponse.json(
        { error: 'این عضو تسویه‌حساب‌هایی دارد و نمی‌توان حذفش کرد' },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'خطا در حذف عضو' }, { status: 500 })
  }
}
