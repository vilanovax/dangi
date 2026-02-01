/**
 * Building Dashboard Utility Functions
 *
 * Centralized utilities for building template to reduce code duplication
 * and improve maintainability.
 */

/**
 * Severity levels for debt visualization
 */
export type DebtSeverity = 'critical' | 'warning' | 'normal'

/**
 * Color scheme for different severity levels
 */
export interface SeverityColors {
  badgeBg: string
  badgeColor: string
  buttonBg: string
  buttonColor: string
}

/**
 * Get severity level based on number of unpaid months
 * @param unpaidMonths - Number of months unpaid
 * @returns Severity level
 */
export function getDebtSeverity(unpaidMonths: number): DebtSeverity {
  if (unpaidMonths >= 6) return 'critical'
  if (unpaidMonths >= 3) return 'warning'
  return 'normal'
}

/**
 * Get CSS variable colors based on debt severity
 * @param unpaidMonths - Number of months unpaid
 * @returns Color scheme object with CSS variable references
 */
export function getSeverityColors(unpaidMonths: number): SeverityColors {
  if (unpaidMonths >= 6) {
    return {
      badgeBg: 'var(--building-danger-alpha)',
      badgeColor: 'var(--building-danger)',
      buttonBg: 'var(--building-danger)',
      buttonColor: 'white',
    }
  } else if (unpaidMonths >= 3) {
    return {
      badgeBg: 'var(--building-warning-alpha)',
      badgeColor: 'var(--building-warning)',
      buttonBg: 'var(--building-warning)',
      buttonColor: 'white',
    }
  } else {
    return {
      badgeBg: 'var(--building-primary-alpha)',
      badgeColor: 'var(--building-primary)',
      buttonBg: 'var(--building-primary)',
      buttonColor: 'white',
    }
  }
}

/**
 * Calculate unpaid months from paid months total
 * @param paidMonths - Number of months paid
 * @param totalMonths - Total months in period (default: 12)
 * @returns Number of unpaid months
 */
export function calculateUnpaidMonths(paidMonths: number, totalMonths = 12): number {
  return totalMonths - paidMonths
}

/**
 * Payment status type
 */
export type PaymentStatus = 'complete' | 'partial' | 'none'

/**
 * Determine payment status based on paid months
 * @param paidMonths - Number of months paid
 * @param totalMonths - Total months in period (default: 12)
 * @returns Payment status
 */
export function getPaymentStatus(paidMonths: number, totalMonths = 12): PaymentStatus {
  if (paidMonths === totalMonths) return 'complete'
  if (paidMonths > 0) return 'partial'
  return 'none'
}

/**
 * Check if collection rate is considered low
 * @param percentage - Collection percentage (0-100)
 * @param threshold - Threshold percentage (default: 30)
 * @returns True if collection is low
 */
export function isLowCollection(percentage: number, threshold = 30): boolean {
  return percentage < threshold
}

/**
 * Sort participants by debt priority (highest debt first)
 * @param participants - Array of participant stats
 * @returns Sorted array with highest debtors first
 */
export function sortByDebtPriority<T extends { paidMonths: number }>(
  participants: T[]
): T[] {
  return [...participants].sort((a, b) => a.paidMonths - b.paidMonths)
}

/**
 * Filter unpaid participants
 * @param participants - Array of participant stats
 * @returns Array of participants with incomplete payment
 */
export function filterUnpaidParticipants<T extends { status: string; paidMonths: number }>(
  participants: T[],
  totalMonths = 12
): T[] {
  return participants.filter((p) => p.status !== 'complete' && p.paidMonths < totalMonths)
}

/**
 * Alert type for dashboard notifications
 */
export type AlertType = 'success' | 'warning' | 'info' | 'danger'

/**
 * Get alert color scheme
 * @param type - Alert type
 * @returns Color scheme for alert
 */
export function getAlertColors(type: AlertType): {
  bg: string
  border: string
  icon: string
} {
  const colorMap = {
    success: {
      bg: 'var(--building-success-alpha)',
      border: 'var(--building-success)',
      icon: 'var(--building-success)',
    },
    warning: {
      bg: 'var(--building-warning-alpha)',
      border: 'var(--building-warning)',
      icon: 'var(--building-warning)',
    },
    info: {
      bg: 'var(--building-info-alpha)',
      border: 'var(--building-info)',
      icon: 'var(--building-info)',
    },
    danger: {
      bg: 'var(--building-danger-alpha)',
      border: 'var(--building-danger)',
      icon: 'var(--building-danger)',
    },
  }
  return colorMap[type]
}

/**
 * Format percentage with Persian numerals
 * @param value - Percentage value (0-100)
 * @returns Formatted string (e.g., "۷۵٪")
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Get readable month count in Persian
 * @param count - Number of months
 * @returns Formatted string (e.g., "۳ ماه")
 */
export function formatMonthCount(count: number): string {
  return `${count} ماه`
}
