/**
 * Access Link Types
 * Types for project access link system with scope-based permissions
 */

// ═══════════════════════════════════════════════════════════════
// ACCESS SCOPES
// ═══════════════════════════════════════════════════════════════

/**
 * Access scope definitions
 * Scopes control what actions a link holder can perform
 */
export type AccessScope =
  | 'expenses:read' // مشاهده خرج‌ها
  | 'expenses:create' // افزودن خرج جدید
  | 'settlements:read' // مشاهده تسویه‌ها
  | 'settlements:create' // ثبت تسویه
  | 'summary:read' // مشاهده خلاصه حساب
  | 'member:join' // پیوستن به عنوان عضو
  | 'project:read' // مشاهده اطلاعات پروژه

/**
 * Access role
 * High-level role for UI display
 */
export type AccessRole = 'viewer' | 'contributor' | 'admin'

// ═══════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Project Access Link
 * Represents a shareable link with specific permissions
 */
export interface ProjectAccessLink {
  id: string
  projectId: string
  token: string
  name: string | null
  description: string | null
  scopes: AccessScope[]
  role: AccessRole | null
  isActive: boolean
  expiresAt: string | null
  maxUses: number | null
  usedCount: number
  lastUsedAt: string | null
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Input for creating a new access link
 */
export interface CreateAccessLinkInput {
  projectId: string
  name?: string
  description?: string
  scopes: AccessScope[]
  role?: AccessRole
  expiresAt?: Date
  maxUses?: number
}

/**
 * Input for updating an access link
 */
export interface UpdateAccessLinkInput {
  name?: string
  description?: string
  scopes?: AccessScope[]
  expiresAt?: Date | null
  maxUses?: number
  isActive?: boolean
}

/**
 * Result of validating an access link
 */
export interface AccessLinkValidationResult {
  valid: boolean
  reason?: string
  projectId?: string
  scopes?: AccessScope[]
  link?: ProjectAccessLink
}

// ═══════════════════════════════════════════════════════════════
// LINK TEMPLATES
// ═══════════════════════════════════════════════════════════════

/**
 * Predefined link template
 * Makes it easy for users to create common link types
 */
export interface AccessLinkTemplate {
  id: string
  name: string
  namePersian: string
  description: string
  descriptionPersian: string
  scopes: AccessScope[]
  role: AccessRole
  icon: string
  badge?: string // Badge text in Persian
}

/**
 * Predefined access link templates
 * Users can choose from these 3 templates
 */
export const ACCESS_LINK_TEMPLATES: AccessLinkTemplate[] = [
  {
    id: 'read-only',
    name: 'Read-Only Access',
    namePersian: 'فقط مشاهده',
    description: 'View expenses, settlements, and summary',
    descriptionPersian: 'مشاهده خرج‌ها، تسویه‌ها و خلاصه حساب بدون امکان تغییر',
    scopes: ['expenses:read', 'settlements:read', 'summary:read', 'project:read'],
    role: 'viewer',
    icon: '👁',
    badge: 'بدون ثبت‌نام',
  },
  {
    id: 'guest-contributor',
    name: 'Guest Contributor',
    namePersian: 'ثبت خرج (مهمان)',
    description: 'Add and view expenses',
    descriptionPersian: 'امکان اضافه کردن خرج، بدون دسترسی به تسویه',
    scopes: ['expenses:read', 'expenses:create', 'project:read'],
    role: 'contributor',
    icon: '✍️',
    badge: 'بدون ثبت‌نام',
  },
  {
    id: 'invite-member',
    name: 'Invite Member',
    namePersian: 'دعوت به عضویت',
    description: 'Join as full member',
    descriptionPersian: 'با ثبت‌نام، عضو پروژه می‌شن',
    scopes: ['member:join'],
    role: 'admin',
    icon: '👥',
    badge: 'نیاز به ثبت‌نام',
  },
]

// ═══════════════════════════════════════════════════════════════
// EXPIRATION PRESETS
// ═══════════════════════════════════════════════════════════════

/**
 * Expiration preset option
 */
export interface ExpirationPreset {
  id: string
  label: string
  labelPersian: string
  days: number | null // null = no expiration
}

/**
 * Quick expiration options
 */
export const EXPIRATION_PRESETS: ExpirationPreset[] = [
  {
    id: '1-day',
    label: '1 Day',
    labelPersian: '1 روز',
    days: 1,
  },
  {
    id: '1-week',
    label: '1 Week',
    labelPersian: '1 هفته',
    days: 7,
  },
  {
    id: '1-month',
    label: '1 Month',
    labelPersian: '1 ماه',
    days: 30,
  },
  {
    id: 'no-expiration',
    label: 'No Expiration',
    labelPersian: 'بدون انقضا',
    days: null,
  },
]

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): AccessLinkTemplate | undefined {
  return ACCESS_LINK_TEMPLATES.find((t) => t.id === templateId)
}

/**
 * Get template by role
 */
export function getTemplateByRole(role: AccessRole): AccessLinkTemplate | undefined {
  return ACCESS_LINK_TEMPLATES.find((t) => t.role === role)
}

/**
 * Check if link is expired
 */
export function isLinkExpired(link: ProjectAccessLink): boolean {
  if (!link.expiresAt) return false
  return new Date(link.expiresAt) < new Date()
}

/**
 * Check if link has reached max uses
 */
export function hasReachedMaxUses(link: ProjectAccessLink): boolean {
  if (!link.maxUses) return false
  return link.usedCount >= link.maxUses
}

/**
 * Get link status
 */
export function getLinkStatus(link: ProjectAccessLink): 'active' | 'expired' | 'max-uses' | 'inactive' {
  if (!link.isActive) return 'inactive'
  if (isLinkExpired(link)) return 'expired'
  if (hasReachedMaxUses(link)) return 'max-uses'
  return 'active'
}

/**
 * Get link status label in Persian
 */
export function getLinkStatusLabel(link: ProjectAccessLink): string {
  const status = getLinkStatus(link)
  switch (status) {
    case 'active':
      return 'فعال'
    case 'expired':
      return 'منقضی شده'
    case 'max-uses':
      return 'حداکثر استفاده'
    case 'inactive':
      return 'غیرفعال'
    default:
      return 'نامشخص'
  }
}

/**
 * Calculate expiration date from preset
 */
export function calculateExpirationDate(days: number | null): Date | undefined {
  if (days === null) return undefined
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}
