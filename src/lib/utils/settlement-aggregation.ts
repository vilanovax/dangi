/**
 * Settlement Aggregation Utility
 *
 * Intelligently groups multiple settlement instructions between the same
 * payer and receiver to reduce cognitive load while maintaining trust.
 *
 * UX Principles:
 * - Aggregation = Ease
 * - Transparency = Trust
 * - Never hide information, only simplify presentation
 */

// ============================================
// Types
// ============================================

export interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export interface AggregatedSettlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  totalAmount: number
  originalCount: number // Number of settlements merged into this one
  settlements: Settlement[] // Original individual settlements for transparency
  isAggregated: boolean // True if multiple settlements were merged
}

// ============================================
// Aggregation Function
// ============================================

/**
 * Aggregates settlement instructions by (fromId, toId) pair
 *
 * Algorithm:
 * 1. Group settlements by unique (fromId, toId) combinations
 * 2. Sum amounts within each group
 * 3. Filter out zero-sum results
 * 4. Mark aggregated vs single settlements
 *
 * Performance: O(n) where n = number of settlements
 *
 * @param settlements - Array of settlement instructions
 * @returns Aggregated settlement list with metadata
 */
export function aggregateSettlements(settlements: Settlement[]): AggregatedSettlement[] {
  // Edge case: empty or single settlement
  if (settlements.length === 0) {
    return []
  }

  // Group settlements by (fromId, toId) using a Map for O(1) lookup
  const groupMap = new Map<string, Settlement[]>()

  for (const settlement of settlements) {
    // Create unique key for this direction of payment
    const key = `${settlement.fromId}->${settlement.toId}`

    if (!groupMap.has(key)) {
      groupMap.set(key, [])
    }
    groupMap.get(key)!.push(settlement)
  }

  // Convert groups to aggregated settlements
  const aggregated: AggregatedSettlement[] = []

  for (const [_key, group] of groupMap.entries()) {
    // Calculate total amount for this group
    const totalAmount = group.reduce((sum, s) => sum + s.amount, 0)

    // Skip if total is zero (shouldn't happen, but safety check)
    if (Math.abs(totalAmount) < 0.01) {
      continue
    }

    // Use the first settlement's metadata (all in group share same from/to)
    const representative = group[0]

    // UX: Mark as aggregated only if multiple settlements were merged
    const isAggregated = group.length > 1

    aggregated.push({
      fromId: representative.fromId,
      fromName: representative.fromName,
      toId: representative.toId,
      toName: representative.toName,
      totalAmount,
      originalCount: group.length,
      settlements: group, // Preserve originals for transparency
      isAggregated,
    })
  }

  // Sort by amount (largest first) for prioritization
  aggregated.sort((a, b) => b.totalAmount - a.totalAmount)

  return aggregated
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets human-readable count text for aggregated settlements
 *
 * @param count - Number of settlements merged
 * @returns Localized count text (Persian)
 */
export function getAggregationCountText(count: number): string {
  if (count === 1) {
    return '' // Not aggregated
  }
  return `شامل ${count} تسویه`
}

/**
 * Checks if any settlements can be aggregated
 *
 * @param settlements - Settlement list
 * @returns True if aggregation will reduce the list
 */
export function canAggregate(settlements: Settlement[]): boolean {
  const uniquePairs = new Set<string>()

  for (const s of settlements) {
    uniquePairs.add(`${s.fromId}->${s.toId}`)
  }

  // Aggregation is beneficial if unique pairs < total settlements
  return uniquePairs.size < settlements.length
}
