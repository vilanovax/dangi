// Expense Splitter Factory
// This module handles different split strategies

import type { SplitResult, SplitType } from '@/lib/types/domain'

interface Participant {
  id: string
  weight: number
  percentage?: number | null
}

interface SplitOptions {
  amount: number
  participants: Participant[]
  splitType: SplitType
  customShares?: { participantId: string; amount: number }[]
}

/**
 * تقسیم مساوی - هر نفر سهم برابر
 */
function splitEqual(amount: number, participants: Participant[]): SplitResult[] {
  const shareAmount = amount / participants.length

  return participants.map((p) => ({
    participantId: p.id,
    amount: shareAmount,
    weight: 1,
  }))
}

/**
 * تقسیم وزنی - بر اساس وزن هر شرکت‌کننده (مثلاً متراژ)
 */
function splitWeighted(amount: number, participants: Participant[]): SplitResult[] {
  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0)

  return participants.map((p) => ({
    participantId: p.id,
    amount: (amount * p.weight) / totalWeight,
    weight: p.weight,
  }))
}

/**
 * تقسیم درصدی - بر اساس درصد مشخص شده
 */
function splitPercentage(amount: number, participants: Participant[]): SplitResult[] {
  return participants.map((p) => ({
    participantId: p.id,
    amount: (amount * (p.percentage || 0)) / 100,
    weight: p.percentage || 0,
  }))
}

/**
 * تقسیم دستی - مبالغ مشخص شده توسط کاربر
 */
function splitManual(
  customShares: { participantId: string; amount: number }[]
): SplitResult[] {
  return customShares.map((share) => ({
    participantId: share.participantId,
    amount: share.amount,
    weight: 1,
  }))
}

/**
 * Main splitter function - Factory pattern
 */
export function calculateSplit(options: SplitOptions): SplitResult[] {
  const { amount, participants, splitType, customShares } = options

  switch (splitType) {
    case 'EQUAL':
      return splitEqual(amount, participants)

    case 'WEIGHTED':
      return splitWeighted(amount, participants)

    case 'PERCENTAGE':
      return splitPercentage(amount, participants)

    case 'MANUAL':
      if (!customShares) {
        throw new Error('Custom shares required for MANUAL split type')
      }
      return splitManual(customShares)

    default:
      return splitEqual(amount, participants)
  }
}

/**
 * Validate that split adds up correctly
 */
export function validateSplit(amount: number, shares: SplitResult[]): boolean {
  const total = shares.reduce((sum, s) => sum + s.amount, 0)
  // Allow small floating point differences
  return Math.abs(total - amount) < 0.01
}
