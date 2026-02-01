/**
 * Access Link Service
 * Data access layer for project access links
 */

import { prisma } from '@/lib/db/prisma'
import type {
  CreateAccessLinkInput,
  UpdateAccessLinkInput,
  ProjectAccessLink,
  AccessLinkValidationResult,
  AccessScope,
} from '@/types/access-link'

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse scopes from database JSON string to array
 */
function parseScopes(scopesString: string): AccessScope[] {
  try {
    return JSON.parse(scopesString) as AccessScope[]
  } catch {
    return []
  }
}

/**
 * Serialize scopes array to JSON string for database
 */
function serializeScopes(scopes: AccessScope[]): string {
  return JSON.stringify(scopes)
}

/**
 * Transform database access link to API format
 */
function transformAccessLink(link: any): ProjectAccessLink {
  return {
    id: link.id,
    projectId: link.projectId,
    token: link.token,
    name: link.name,
    description: link.description,
    scopes: parseScopes(link.scopes),
    role: link.role,
    isActive: link.isActive,
    expiresAt: link.expiresAt?.toISOString() || null,
    maxUses: link.maxUses,
    usedCount: link.usedCount,
    lastUsedAt: link.lastUsedAt?.toISOString() || null,
    createdByUserId: link.createdByUserId,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new access link for a project
 */
export async function createAccessLink(input: CreateAccessLinkInput): Promise<ProjectAccessLink> {
  const { projectId, name, description, scopes, role, expiresAt, maxUses } = input

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new Error('پروژه یافت نشد')
  }

  // Validate scopes
  if (!scopes || scopes.length === 0) {
    throw new Error('حداقل یک دسترسی باید مشخص شود')
  }

  const link = await prisma.projectAccessLink.create({
    data: {
      projectId,
      name: name || null,
      description: description || null,
      scopes: serializeScopes(scopes),
      role: role || null,
      expiresAt: expiresAt || null,
      maxUses: maxUses || null,
      isActive: true,
      usedCount: 0,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  return transformAccessLink(link)
}

// ═══════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════

/**
 * Get a single access link by ID
 */
export async function getAccessLinkById(linkId: string): Promise<ProjectAccessLink | null> {
  const link = await prisma.projectAccessLink.findUnique({
    where: { id: linkId },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  if (!link) return null

  return transformAccessLink(link)
}

/**
 * Get a single access link by token
 */
export async function getAccessLinkByToken(token: string): Promise<ProjectAccessLink | null> {
  const link = await prisma.projectAccessLink.findUnique({
    where: { token },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  if (!link) return null

  return transformAccessLink(link)
}

/**
 * Get all access links for a project
 */
export async function getProjectAccessLinks(projectId: string): Promise<ProjectAccessLink[]> {
  const links = await prisma.projectAccessLink.findMany({
    where: { projectId },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  return links.map(transformAccessLink)
}

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════

/**
 * Update an access link
 */
export async function updateAccessLink(
  linkId: string,
  input: UpdateAccessLinkInput
): Promise<ProjectAccessLink> {
  const link = await prisma.projectAccessLink.findUnique({
    where: { id: linkId },
  })

  if (!link) {
    throw new Error('لینک دسترسی یافت نشد')
  }

  const updated = await prisma.projectAccessLink.update({
    where: { id: linkId },
    data: {
      name: input.name !== undefined ? input.name : undefined,
      description: input.description !== undefined ? input.description : undefined,
      scopes: input.scopes ? serializeScopes(input.scopes) : undefined,
      expiresAt: input.expiresAt !== undefined ? input.expiresAt : undefined,
      maxUses: input.maxUses !== undefined ? input.maxUses : undefined,
      isActive: input.isActive !== undefined ? input.isActive : undefined,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  return transformAccessLink(updated)
}

/**
 * Deactivate an access link
 */
export async function deactivateAccessLink(linkId: string): Promise<ProjectAccessLink> {
  const link = await prisma.projectAccessLink.findUnique({
    where: { id: linkId },
  })

  if (!link) {
    throw new Error('لینک دسترسی یافت نشد')
  }

  const updated = await prisma.projectAccessLink.update({
    where: { id: linkId },
    data: { isActive: false },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  return transformAccessLink(updated)
}

/**
 * Reactivate an access link
 */
export async function reactivateAccessLink(linkId: string): Promise<ProjectAccessLink> {
  const link = await prisma.projectAccessLink.findUnique({
    where: { id: linkId },
  })

  if (!link) {
    throw new Error('لینک دسترسی یافت نشد')
  }

  const updated = await prisma.projectAccessLink.update({
    where: { id: linkId },
    data: { isActive: true },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  return transformAccessLink(updated)
}

// ═══════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════

/**
 * Delete an access link permanently
 */
export async function deleteAccessLink(linkId: string): Promise<void> {
  const link = await prisma.projectAccessLink.findUnique({
    where: { id: linkId },
  })

  if (!link) {
    throw new Error('لینک دسترسی یافت نشد')
  }

  await prisma.projectAccessLink.delete({
    where: { id: linkId },
  })
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION & USAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Validate access link - check if it's still valid for use
 */
export async function validateAccessLink(token: string): Promise<AccessLinkValidationResult> {
  const link = await getAccessLinkByToken(token)

  if (!link) {
    return { valid: false, reason: 'لینک دسترسی یافت نشد' }
  }

  if (!link.isActive) {
    return { valid: false, reason: 'این لینک دسترسی غیرفعال است' }
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return { valid: false, reason: 'این لینک دسترسی منقضی شده است' }
  }

  if (link.maxUses && link.usedCount >= link.maxUses) {
    return { valid: false, reason: 'این لینک دسترسی حداکثر تعداد استفاده را داشته است' }
  }

  return {
    valid: true,
    projectId: link.projectId,
    scopes: link.scopes,
    link,
  }
}

/**
 * Increment usage count when link is used
 */
export async function incrementLinkUsage(linkId: string): Promise<void> {
  const link = await prisma.projectAccessLink.findUnique({
    where: { id: linkId },
  })

  if (!link) {
    throw new Error('لینک دسترسی یافت نشد')
  }

  // Check if link is still valid before incrementing
  if (link.maxUses && link.usedCount >= link.maxUses) {
    throw new Error('این لینک دسترسی حداکثر تعداد استفاده را داشته است')
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new Error('این لینک دسترسی منقضی شده است')
  }

  if (!link.isActive) {
    throw new Error('این لینک دسترسی غیرفعال است')
  }

  await prisma.projectAccessLink.update({
    where: { id: linkId },
    data: {
      usedCount: link.usedCount + 1,
      lastUsedAt: new Date(),
    },
  })
}

// ═══════════════════════════════════════════════════════════════
// SERVICE OBJECT (optional convenience export)
// ═══════════════════════════════════════════════════════════════

export const accessLinkService = {
  create: createAccessLink,
  getById: getAccessLinkById,
  getByToken: getAccessLinkByToken,
  getProjectLinks: getProjectAccessLinks,
  update: updateAccessLink,
  deactivate: deactivateAccessLink,
  reactivate: reactivateAccessLink,
  delete: deleteAccessLink,
  validate: validateAccessLink,
  incrementUsage: incrementLinkUsage,
}
