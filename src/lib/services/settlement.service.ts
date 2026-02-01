// Settlement Service
// Data access layer for settlements (payments between members)

import { prisma } from '@/lib/db/prisma'

export interface SettlementInput {
  fromId: string    // کسی که پول داده
  toId: string      // کسی که پول گرفته
  amount: number
  note?: string
  receiptUrl?: string
  settledAt?: Date
}

/**
 * Create a new settlement (with pending status by default)
 */
export async function createSettlement(projectId: string, input: SettlementInput) {
  const { fromId, toId, amount, note, receiptUrl, settledAt } = input

  // Validate participants belong to project
  const participants = await prisma.participant.findMany({
    where: {
      projectId,
      id: { in: [fromId, toId] }
    }
  })

  if (participants.length !== 2) {
    throw new Error('هر دو طرف باید عضو پروژه باشند')
  }

  if (fromId === toId) {
    throw new Error('پرداخت‌کننده و دریافت‌کننده نمی‌توانند یکی باشند')
  }

  return prisma.settlement.create({
    data: {
      projectId,
      fromId,
      toId,
      amount,
      note,
      receiptUrl,
      settledAt: settledAt || new Date(),
      status: 'pending', // Start as pending for 30-second undo window
      type: 'normal',
    },
    include: {
      from: true,
      to: true,
    },
  })
}

/**
 * Confirm a pending settlement (called after 30-second window)
 */
export async function confirmSettlement(settlementId: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  })

  if (!settlement) {
    throw new Error('تسویه یافت نشد')
  }

  if (settlement.status !== 'pending') {
    throw new Error('فقط تسویه‌های در انتظار قابل تأیید هستند')
  }

  return prisma.settlement.update({
    where: { id: settlementId },
    data: { status: 'confirmed' },
    include: {
      from: true,
      to: true,
    },
  })
}

/**
 * Undo a pending settlement (within 30-second window)
 */
export async function undoSettlement(settlementId: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  })

  if (!settlement) {
    throw new Error('تسویه یافت نشد')
  }

  if (settlement.status !== 'pending') {
    throw new Error('فقط تسویه‌های در انتظار قابل بازگشت هستند')
  }

  // Check if within 30-second window
  const now = new Date()
  const createdAt = new Date(settlement.createdAt)
  const elapsed = (now.getTime() - createdAt.getTime()) / 1000 // seconds

  if (elapsed > 30) {
    throw new Error('زمان بازگشت تسویه به پایان رسیده است')
  }

  // Delete the settlement (undo)
  return prisma.settlement.delete({
    where: { id: settlementId },
  })
}

/**
 * Reverse a confirmed settlement (create counter-entry)
 */
export async function reverseSettlement(settlementId: string, note?: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: {
      from: true,
      to: true,
    },
  })

  if (!settlement) {
    throw new Error('تسویه یافت نشد')
  }

  if (settlement.reversed) {
    throw new Error('این تسویه قبلاً بازگردانی شده است')
  }

  if (settlement.type === 'reverse') {
    throw new Error('نمی‌توان تسویه بازگردانی شده را مجدداً بازگردانی کرد')
  }

  // Create reverse settlement (counter-entry)
  const reverseSettlement = await prisma.settlement.create({
    data: {
      projectId: settlement.projectId,
      fromId: settlement.toId, // Swap from/to
      toId: settlement.fromId,
      amount: settlement.amount,
      note: note || `بازگردانی: ${settlement.note || 'تسویه'}`,
      status: 'confirmed', // Reverse settlements are immediately confirmed
      type: 'reverse',
      referenceSettlementId: settlementId,
      settledAt: new Date(),
    },
    include: {
      from: true,
      to: true,
    },
  })

  // Mark original settlement as reversed
  await prisma.settlement.update({
    where: { id: settlementId },
    data: { reversed: true },
  })

  return reverseSettlement
}

/**
 * Get all settlements for a project
 */
export async function getProjectSettlements(projectId: string) {
  return prisma.settlement.findMany({
    where: { projectId },
    include: {
      from: true,
      to: true,
    },
    orderBy: {
      settledAt: 'desc',
    },
  })
}

/**
 * Get a single settlement by ID
 */
export async function getSettlementById(settlementId: string) {
  return prisma.settlement.findUnique({
    where: { id: settlementId },
    include: {
      from: true,
      to: true,
    },
  })
}

/**
 * Update a settlement
 */
export async function updateSettlement(
  settlementId: string,
  input: Partial<SettlementInput>
) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  })

  if (!settlement) {
    throw new Error('تسویه یافت نشد')
  }

  // Validate participants if changed
  if (input.fromId || input.toId) {
    const fromId = input.fromId || settlement.fromId
    const toId = input.toId || settlement.toId

    if (fromId === toId) {
      throw new Error('پرداخت‌کننده و دریافت‌کننده نمی‌توانند یکی باشند')
    }

    const participants = await prisma.participant.findMany({
      where: {
        projectId: settlement.projectId,
        id: { in: [fromId, toId] }
      }
    })

    if (participants.length !== 2) {
      throw new Error('هر دو طرف باید عضو پروژه باشند')
    }
  }

  return prisma.settlement.update({
    where: { id: settlementId },
    data: {
      fromId: input.fromId,
      toId: input.toId,
      amount: input.amount,
      note: input.note,
      receiptUrl: input.receiptUrl,
      settledAt: input.settledAt,
    },
    include: {
      from: true,
      to: true,
    },
  })
}

/**
 * Delete a settlement
 */
export async function deleteSettlement(settlementId: string) {
  return prisma.settlement.delete({
    where: { id: settlementId },
  })
}
