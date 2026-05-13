/**
 * Permission Utilities
 * Helper functions for checking access scopes and permissions
 */

import type { AccessScope } from '@/types/access-link'

// ═══════════════════════════════════════════════════════════════
// SCOPE CHECKING
// ═══════════════════════════════════════════════════════════════

/**
 * Check if user has a specific scope
 *
 * @param userScopes - Scopes granted to the user
 * @param requiredScope - Scope that is required
 * @returns true if user has the required scope
 */
export function hasScope(userScopes: AccessScope[], requiredScope: AccessScope): boolean {
  return userScopes.includes(requiredScope)
}

/**
 * Check if user has ANY of the required scopes
 *
 * @param userScopes - Scopes granted to the user
 * @param requiredScopes - Array of scopes (user needs at least one)
 * @returns true if user has at least one of the required scopes
 */
export function hasAnyScope(userScopes: AccessScope[], requiredScopes: AccessScope[]): boolean {
  return requiredScopes.some((scope) => userScopes.includes(scope))
}

/**
 * Check if user has ALL of the required scopes
 *
 * @param userScopes - Scopes granted to the user
 * @param requiredScopes - Array of scopes (user needs all)
 * @returns true if user has all of the required scopes
 */
export function hasAllScopes(userScopes: AccessScope[], requiredScopes: AccessScope[]): boolean {
  return requiredScopes.every((scope) => userScopes.includes(scope))
}

export function parseStoredParticipantScopes(scopes: string | null): AccessScope[] | null {
  if (scopes === null) {
    return null
  }

  try {
    const parsed = JSON.parse(scopes)
    return Array.isArray(parsed) ? (parsed as AccessScope[]) : []
  } catch {
    return []
  }
}

export function participantHasRequiredScopes(
  storedScopes: string | null,
  requiredScopes?: AccessScope[]
): boolean {
  const participantScopes = parseStoredParticipantScopes(storedScopes)

  if (participantScopes === null) {
    return true
  }

  if (!requiredScopes || requiredScopes.length === 0) {
    return false
  }

  return hasAllScopes(participantScopes, requiredScopes)
}

// ═══════════════════════════════════════════════════════════════
// RESOURCE ACCESS CHECKING
// ═══════════════════════════════════════════════════════════════

/**
 * Check if user can access a resource with a specific action
 *
 * @param scopes - Scopes granted to the user
 * @param resource - Resource type (e.g., 'expenses', 'settlements')
 * @param action - Action type (e.g., 'read', 'create')
 * @returns true if user can perform the action on the resource
 *
 * @example
 * canAccessResource(['expenses:read', 'expenses:create'], 'expenses', 'read') // true
 * canAccessResource(['expenses:read'], 'expenses', 'create') // false
 */
export function canAccessResource(
  scopes: AccessScope[],
  resource: string,
  action: string
): boolean {
  const scopeString = `${resource}:${action}` as AccessScope
  return hasScope(scopes, scopeString)
}

/**
 * Check if user can read a resource
 *
 * @param scopes - Scopes granted to the user
 * @param resource - Resource type (e.g., 'expenses', 'settlements')
 * @returns true if user can read the resource
 */
export function canRead(scopes: AccessScope[], resource: string): boolean {
  return canAccessResource(scopes, resource, 'read')
}

/**
 * Check if user can create a resource
 *
 * @param scopes - Scopes granted to the user
 * @param resource - Resource type (e.g., 'expenses', 'settlements')
 * @returns true if user can create the resource
 */
export function canCreate(scopes: AccessScope[], resource: string): boolean {
  return canAccessResource(scopes, resource, 'create')
}

// ═══════════════════════════════════════════════════════════════
// ACCESS LEVEL CHECKING
// ═══════════════════════════════════════════════════════════════

/**
 * Check if user has read-only access
 * (can only view, cannot modify)
 *
 * @param scopes - Scopes granted to the user
 * @returns true if user has only read scopes
 */
export function isReadOnlyAccess(scopes: AccessScope[]): boolean {
  const writeScopes: AccessScope[] = [
    'expenses:create',
    'settlements:create',
    'member:join',
  ]

  return !scopes.some((scope) => writeScopes.includes(scope))
}

/**
 * Check if user can join as member
 *
 * @param scopes - Scopes granted to the user
 * @returns true if user has member:join scope
 */
export function canJoinAsMember(scopes: AccessScope[]): boolean {
  return hasScope(scopes, 'member:join')
}

/**
 * Get access level description in Persian
 *
 * @param scopes - Scopes granted to the user
 * @returns Persian description of access level
 */
export function getAccessLevelDescription(scopes: AccessScope[]): string {
  if (canJoinAsMember(scopes)) {
    return 'پیوستن به عنوان عضو'
  }

  if (canCreate(scopes, 'expenses') && canRead(scopes, 'expenses')) {
    return 'ثبت خرج (مهمان)'
  }

  if (isReadOnlyAccess(scopes)) {
    return 'فقط مشاهده'
  }

  return 'دسترسی محدود'
}

/**
 * Get access badge text in Persian
 *
 * @param scopes - Scopes granted to the user
 * @returns Persian badge text
 */
export function getAccessBadge(scopes: AccessScope[]): string {
  if (canJoinAsMember(scopes)) {
    return 'عضویت'
  }

  if (canCreate(scopes, 'expenses')) {
    return 'مهمان'
  }

  if (isReadOnlyAccess(scopes)) {
    return 'مشاهده‌گر'
  }

  return 'محدود'
}
