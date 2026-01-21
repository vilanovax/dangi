// Participant Service
// Data access layer for participants

import { prisma } from '@/lib/db/prisma'

interface JoinProjectInput {
  projectId: string
  name: string
  weight?: number
}

/**
 * Join a project as a new participant
 */
export async function joinProject(input: JoinProjectInput) {
  const { projectId, name, weight = 1 } = input

  const participant = await prisma.participant.create({
    data: {
      name,
      weight,
      projectId,
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
