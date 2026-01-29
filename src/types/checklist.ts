/**
 * Checklist API Types
 * Types for checklist data from database/API
 */

export interface ChecklistItem {
  id: string
  text: string
  isChecked: boolean
  note?: string | null
  order: number
  checklistId: string
  createdAt: string
  updatedAt: string
}

export interface Checklist {
  id: string
  title: string
  description?: string | null
  category: string
  icon?: string | null
  color?: string | null
  userId: string
  shareCode: string
  isArchived: boolean
  archivedAt?: string | null
  createdAt: string
  updatedAt: string
  items?: ChecklistItem[]
  _count?: {
    items: number
  }
}

export interface ChecklistStats {
  total: number
  checked: number
  unchecked: number
  progress: number // percentage 0-100
}

export interface ChecklistWithStats extends Checklist {
  stats: ChecklistStats
}

/**
 * Create checklist input
 */
export interface CreateChecklistInput {
  title: string
  description?: string
  category: string
  icon?: string
  color?: string
}

/**
 * Create checklist from template input
 */
export interface CreateChecklistFromTemplateInput {
  templateId: string
  customTitle?: string // optional custom title
}

/**
 * Update checklist input
 */
export interface UpdateChecklistInput {
  title?: string
  description?: string | null
  icon?: string | null
  color?: string | null
}

/**
 * Create checklist item input
 */
export interface CreateChecklistItemInput {
  text: string
  note?: string
  order?: number
}

/**
 * Update checklist item input
 */
export interface UpdateChecklistItemInput {
  text?: string
  note?: string | null
  isChecked?: boolean
  order?: number
}

/**
 * Checklist filter params
 */
export interface ChecklistFilterParams {
  category?: string
  includeArchived?: boolean
}

/**
 * Checklist share (for future use)
 */
export interface ChecklistShare {
  id: string
  checklistId: string
  userId?: string | null
  permission: 'VIEW' | 'EDIT'
  expiresAt?: string | null
  createdAt: string
}
