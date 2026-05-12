// Auth utilities - Password hashing and JWT token management
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { AccessScope, ProjectAccessLink } from '@/types/access-link'
import { validateAccessLink } from '@/lib/services/access-link.service'
import { hasAllScopes } from '@/lib/utils/permissions'

// Bcrypt configuration
const SALT_ROUNDS = 10 // Higher = more secure but slower (10 is recommended)

/**
 * Hash a password using bcrypt
 * Uses salt rounds of 10 for a good balance of security and performance
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a bcrypt hash
 * Also handles migration from old SHA-256 hashes
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<{ valid: boolean; needsMigration: boolean }> {
  // Try bcrypt first (current standard)
  try {
    const isValid = await bcrypt.compare(password, hashedPassword)
    if (isValid) {
      return { valid: true, needsMigration: false }
    }
  } catch (error) {
    // Not a bcrypt hash, might be old SHA-256 format
  }

  // Check if it's an old SHA-256 hash (64 hex characters)
  if (hashedPassword.length === 64 && /^[a-f0-9]+$/i.test(hashedPassword)) {
    const oldHash = await hashPasswordLegacy(password)
    if (oldHash === hashedPassword) {
      // Valid password, but needs migration to bcrypt
      return { valid: true, needsMigration: true }
    }
  }

  return { valid: false, needsMigration: false }
}

/**
 * Legacy SHA-256 hash function (for migration only)
 * DO NOT use for new passwords
 */
async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + (process.env.AUTH_SECRET || 'dangi-secret-key'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// JWT token generation and verification
const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'dangi-secret-key-2024'

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  JWT_SECRET not set! Using fallback secret. This is insecure for production.')
}

export function generateToken(userId: string): string {
  try {
    return jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
  } catch (error) {
    console.error('Error generating JWT token:', error)
    throw new Error('Failed to generate authentication token')
  }
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null
  }
}

// Helper to get current user from cookies (for server components)
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null

    const userId = verifyToken(token)
    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
      },
    })

    return user
  } catch {
    return null
  }
}

// Authorization helper: Check if user has access to a project
import { NextResponse } from 'next/server'

interface AuthResult {
  authorized: true
  accessType: 'participant'
  user: { id: string; phone: string; name: string }
  participant: { id: string; userId: string | null; projectId: string; scopes: string | null }
}

interface LinkAuthResult {
  authorized: true
  accessType: 'link'
  link: ProjectAccessLink
  scopes: AccessScope[]
}

interface UnauthorizedResult {
  authorized: false
  response: NextResponse
}

export async function requireProjectAccess(
  projectId: string,
  requiredScopes?: AccessScope[]
): Promise<AuthResult | UnauthorizedResult> {
  // 1. Check if user is authenticated
  const user = await getCurrentUser()
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید' },
        { status: 401 }
      ),
    }
  }

  // 2. Check if user is a participant of this project
  const participant = await prisma.participant.findFirst({
    where: {
      projectId,
      userId: user.id,
    },
    select: {
      id: true,
      userId: true,
      projectId: true,
      scopes: true, // Include scopes to check for restricted access
    },
  })

  if (!participant) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'شما به این پروژه دسترسی ندارید' },
        { status: 403 }
      ),
    }
  }

  if (participant.scopes !== null) {
    const participantScopes = parseParticipantScopes(participant.scopes)

    if (!requiredScopes || requiredScopes.length === 0) {
      return insufficientScopedAccessResponse()
    }

    if (!hasAllScopes(participantScopes, requiredScopes)) {
      return insufficientScopedAccessResponse()
    }
  }

  // User has access
  return {
    authorized: true,
    accessType: 'participant',
    user,
    participant,
  }
}

/**
 * Check project access with support for both participant-based and link-based access
 *
 * @param projectId - Project ID to check access for
 * @param requiredScopes - Optional scopes required for this operation
 * @returns AuthResult (participant access) | LinkAuthResult (link access) | UnauthorizedResult
 */
export async function requireProjectAccessWithLink(
  projectId: string,
  requiredScopes?: AccessScope[]
): Promise<AuthResult | LinkAuthResult | UnauthorizedResult> {
  // 1. Try participant-based access first (existing logic)
  const participantAccess = await requireProjectAccess(projectId, requiredScopes)

  if (participantAccess.authorized) {
    return participantAccess
  }

  // 2. Participant access failed - check for access link token
  const cookieStore = await cookies()

  // Check cookies first
  const accessToken = cookieStore.get('access_token')?.value

  // If not in cookies, check Authorization header (for API requests)
  if (!accessToken) {
    // Note: In server components/route handlers, we can't directly access headers
    // This will be handled in the API route itself if needed
    // For now, we only support cookie-based access
  }

  if (!accessToken) {
    // No access token found - return the original unauthorized response
    return participantAccess
  }

  // 3. Validate the access link token
  const validation = await validateAccessLink(accessToken)

  if (!validation.valid) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: validation.reason || 'دسترسی رد شد' },
        { status: 403 }
      ),
    }
  }

  // 4. Check if link is for the correct project
  if (validation.projectId !== projectId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'این لینک برای پروژه دیگری است' },
        { status: 403 }
      ),
    }
  }

  // 5. Check if link has required scopes (if specified)
  if (requiredScopes && requiredScopes.length > 0) {
    const linkScopes = validation.scopes || []

    if (!hasAllScopes(linkScopes, requiredScopes)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'دسترسی کافی ندارید' },
          { status: 403 }
        ),
      }
    }
  }

  // 6. Access link is valid and has required scopes
  return {
    authorized: true,
    link: validation.link!,
    scopes: validation.scopes || [],
    accessType: 'link',
  }
}

function parseParticipantScopes(scopesString: string): AccessScope[] {
  try {
    const scopes = JSON.parse(scopesString)
    return Array.isArray(scopes) ? (scopes as AccessScope[]) : []
  } catch {
    return []
  }
}

function insufficientScopedAccessResponse(): UnauthorizedResult {
  return {
    authorized: false,
    response: NextResponse.json(
      { error: 'دسترسی کافی ندارید' },
      { status: 403 }
    ),
  }
}

// Export types for use in API routes
export type { AuthResult, LinkAuthResult, UnauthorizedResult }
