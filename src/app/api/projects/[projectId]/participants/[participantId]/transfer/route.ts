import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { calculateBalances } from '@/lib/domain/summaryCalculator'
import { logApiError } from '@/lib/utils/logger'

type RouteContext = {
  params: Promise<{ projectId: string; participantId: string }>
}

/**
 * Transfer a participant's balance to another participant
 * Creates a settlement to zero out the balance, optionally deletes the participant
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId, participantId } = await context.params
    const body = await request.json()
    const { targetParticipantId, deleteAfterTransfer } = body

    // Validate input
    if (!targetParticipantId) {
      return NextResponse.json(
        { error: 'شرکت‌کننده مقصد را انتخاب کنید' },
        { status: 400 }
      )
    }

    if (participantId === targetParticipantId) {
      return NextResponse.json(
        { error: 'شرکت‌کننده مبدا و مقصد نمی‌توانند یکی باشند' },
        { status: 400 }
      )
    }

    // Get project with all data needed for balance calculation
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        participants: true,
        expenses: {
          include: {
            shares: true,
          },
        },
        settlements: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    }

    // Find source and target participants
    const sourceParticipant = project.participants.find((p) => p.id === participantId)
    const targetParticipant = project.participants.find((p) => p.id === targetParticipantId)

    if (!sourceParticipant) {
      return NextResponse.json({ error: 'شرکت‌کننده مبدا یافت نشد' }, { status: 404 })
    }

    if (!targetParticipant) {
      return NextResponse.json({ error: 'شرکت‌کننده مقصد یافت نشد' }, { status: 404 })
    }

    // Cannot transfer from project owner
    if (sourceParticipant.role === 'OWNER' && deleteAfterTransfer) {
      return NextResponse.json(
        { error: 'مدیر پروژه قابل حذف نیست' },
        { status: 400 }
      )
    }

    // Calculate current balances
    const balances = calculateBalances(
      project.expenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        paidById: e.paidById,
        shares: e.shares.map((s) => ({
          participantId: s.participantId,
          amount: s.amount,
        })),
      })),
      project.participants.map((p) => ({ id: p.id, name: p.name })),
      project.settlements.map((s) => ({
        id: s.id,
        amount: s.amount,
        fromId: s.fromId,
        toId: s.toId,
      }))
    )

    const sourceBalance = balances.find((b) => b.participantId === participantId)
    if (!sourceBalance) {
      return NextResponse.json({ error: 'خطا در محاسبه مانده' }, { status: 500 })
    }

    const balance = sourceBalance.balance

    // If balance is zero, no transfer needed
    if (Math.abs(balance) < 1) {
      if (deleteAfterTransfer) {
        // Just delete the participant
        await prisma.participant.delete({
          where: { id: participantId },
        })
        return NextResponse.json({
          success: true,
          message: 'شرکت‌کننده با موفقیت حذف شد',
          deleted: true,
        })
      }
      return NextResponse.json({
        success: true,
        message: 'مانده حساب صفر است، نیازی به انتقال نیست',
      })
    }

    // Create settlement to transfer balance
    // If source is creditor (positive balance): target pays source → creates settlement from target to source
    // But we're transferring to target, so we need target to "owe" what source was owed
    // This means: if source was creditor, create settlement from source to target (as if source paid target)
    // If source was debtor (negative balance): create settlement from target to source (as if target paid source)

    let settlement
    if (balance > 0) {
      // Source is creditor - to transfer this credit to target,
      // we record that source "received" the money (settlement from target to source's credit)
      // But actually we want target to become the creditor instead
      // So we create: settlement from source to target (source pays their credit to target)
      settlement = await prisma.settlement.create({
        data: {
          projectId,
          fromId: participantId, // source gives their credit
          toId: targetParticipantId, // target receives the credit
          amount: Math.abs(balance),
          note: `انتقال مانده از ${sourceParticipant.name}`,
        },
      })
    } else {
      // Source is debtor - to transfer this debt to target,
      // we create: settlement from target to source (target covers source's debt)
      settlement = await prisma.settlement.create({
        data: {
          projectId,
          fromId: targetParticipantId, // target takes on the debt
          toId: participantId, // source's debt is covered
          amount: Math.abs(balance),
          note: `انتقال بدهی از ${sourceParticipant.name}`,
        },
      })
    }

    // Delete participant if requested
    if (deleteAfterTransfer) {
      // We can now delete because the balance is settled
      // But we need to handle the case where participant has expenses/shares/settlements
      // The settlement we just created references this participant, so we can't delete yet
      // We need to update the settlement to point to target instead

      // Actually, let's check if there are other references
      const hasExpensesPaid = project.expenses.some((e) => e.paidById === participantId)
      const hasShares = project.expenses.some((e) =>
        e.shares.some((s) => s.participantId === participantId)
      )
      const hasOtherSettlements = project.settlements.some(
        (s) => s.fromId === participantId || s.toId === participantId
      )

      if (hasExpensesPaid || hasShares || hasOtherSettlements) {
        // Cannot delete due to existing references
        // The settlement was created to zero out balance, but participant remains
        return NextResponse.json({
          success: true,
          message: 'مانده انتقال یافت، اما شرکت‌کننده به دلیل داشتن سابقه هزینه یا تسویه قابل حذف نیست',
          settlement,
          deleted: false,
        })
      }

      // Safe to delete - no other references
      // First delete the settlement we just created if it references the participant
      await prisma.settlement.delete({
        where: { id: settlement.id },
      })

      await prisma.participant.delete({
        where: { id: participantId },
      })

      return NextResponse.json({
        success: true,
        message: 'مانده انتقال یافت و شرکت‌کننده حذف شد',
        deleted: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'مانده با موفقیت انتقال یافت',
      settlement,
      deleted: false,
    })
  } catch (error) {
    logApiError(error, { context: 'POST /api/projects/[projectId]/participants/[participantId]/transfer' })
    return NextResponse.json(
      { error: 'خطا در انتقال مانده' },
      { status: 500 }
    )
  }
}
