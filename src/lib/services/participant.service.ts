// Participant Service
// Data access layer for participants

import { prisma } from '@/lib/db/prisma'

interface JoinProjectInput {
  projectId: string
  name: string
  weight?: number
  avatar?: string | null
}

/**
 * Join a project as a new participant
 */
export async function joinProject(input: JoinProjectInput) {
  const { projectId, name, weight = 1, avatar } = input

  const participant = await prisma.participant.create({
    data: {
      name,
      weight,
      projectId,
      avatar: avatar || null,
    },
  })

  return participant
}

/**
 * Get participant by session token
 */
export async function getParticipantByToken(sessionToken: string) {
  return prisma.participant.findUnique({
    where: { sessionToken },
    include: {
      project: true,
    },
  })
}

/**
 * Get all participants in a project
 */
export async function getProjectParticipants(projectId: string) {
  return prisma.participant.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Update participant weight (for weighted split)
 */
export async function updateParticipantWeight(
  participantId: string,
  weight: number
) {
  return prisma.participant.update({
    where: { id: participantId },
    data: { weight },
  })
}

/**
 * Update participant percentage (for percentage split)
 */
export async function updateParticipantPercentage(
  participantId: string,
  percentage: number
) {
  return prisma.participant.update({
    where: { id: participantId },
    data: { percentage },
  })
}

/**
 * Get a single participant by ID
 */
export async function getParticipantById(participantId: string) {
  return prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      project: true,
    },
  })
}

/**
 * Update participant details
 */
export async function updateParticipant(
  participantId: string,
  data: {
    name?: string
    weight?: number
    percentage?: number
    avatar?: string | null
  }
) {
  return prisma.participant.update({
    where: { id: participantId },
    data,
  })
}

/**
 * Delete a participant
 * Note: Will fail if participant has expenses paid or shares (referential integrity)
 */
export async function deleteParticipant(participantId: string) {
  // Check if participant has any expenses paid
  const expensesPaid = await prisma.expense.count({
    where: { paidById: participantId },
  })

  if (expensesPaid > 0) {
    throw new Error('PARTICIPANT_HAS_EXPENSES')
  }

  // Check if participant has any expense shares
  const expenseShares = await prisma.expenseShare.count({
    where: { participantId },
  })

  if (expenseShares > 0) {
    throw new Error('PARTICIPANT_HAS_SHARES')
  }

  // Check if participant has any settlements
  const settlements = await prisma.settlement.count({
    where: {
      OR: [{ fromId: participantId }, { toId: participantId }],
    },
  })

  if (settlements > 0) {
    throw new Error('PARTICIPANT_HAS_SETTLEMENTS')
  }

  return prisma.participant.delete({
    where: { id: participantId },
  })
}

/**
 * Check if participant belongs to project
 */
export async function validateParticipantAccess(
  sessionToken: string,
  projectId: string
): Promise<{ valid: boolean; participant?: { id: string; name: string; role: string } }> {
  const participant = await prisma.participant.findFirst({
    where: {
      sessionToken,
      projectId,
    },
  })

  if (!participant) {
    return { valid: false }
  }

  return {
    valid: true,
    participant: {
      id: participant.id,
      name: participant.name,
      role: participant.role,
    },
  }
}
