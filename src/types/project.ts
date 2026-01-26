/**
 * Shared TypeScript types for project-related entities
 * Consolidates duplicate type definitions across the codebase
 */

// ─────────────────────────────────────────────────────────────
// Core Entities
// ─────────────────────────────────────────────────────────────

export interface Participant {
  id: string
  name: string
  role: string
  avatar?: string | null
  weight?: number
  percentage?: number | null
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  description?: string | null
  expenseDate: string
  periodKey?: string | null
  receiptUrl?: string | null
  paidBy: Participant
  category?: Category
}

export interface Settlement {
  id: string
  amount: number
  note?: string | null
  settledAt: string
  from: Participant
  to: Participant
}

export interface Project {
  id: string
  name: string
  description: string | null
  template: string
  currency: string
  shareCode: string
  splitType?: string
  chargeYear?: number | null
  trackingOnly?: boolean
  isArchived?: boolean
  participants: Participant[]
  expenses: Expense[]
  categories: Category[]
}

// ─────────────────────────────────────────────────────────────
// Summary & Balance
// ─────────────────────────────────────────────────────────────

export interface ParticipantBalance {
  participantId: string
  participantName: string
  totalPaid: number
  totalShare: number
  balance: number
}

export interface Summary {
  participantBalances: ParticipantBalance[]
}

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface ProjectResponse {
  project: Project
  myParticipantId?: string | null
}

export interface ExpensesResponse {
  expenses: Expense[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface SummaryResponse {
  summary: Summary
}

export interface SettlementsResponse {
  settlements: Settlement[]
}
