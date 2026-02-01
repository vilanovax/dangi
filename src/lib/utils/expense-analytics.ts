/**
 * Expense Analytics Utilities
 *
 * Pure calculation functions for expense insights.
 * NO UI dependencies, NO side effects.
 */

// ============================================
// Types
// ============================================

export interface Expense {
  id: string
  amount: number
  categoryId?: string | null
}

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

export interface TopCategoryResult {
  /** Category ID */
  categoryId: string
  /** Category name (Persian) */
  categoryName: string
  /** Category icon emoji */
  categoryIcon?: string
  /** Category color hex */
  categoryColor?: string
  /** Total amount spent in this category */
  totalAmount: number
  /** Percentage of total expenses (0-100) */
  percentage: number
}

// ============================================
// Main Calculation Function
// ============================================

/**
 * Calculate Top Spending Categories
 *
 * UX Intent:
 * - Identify 1-2 most impactful categories for quick filtering
 * - Avoid clutter by limiting to max 2 categories
 * - Only show categories with meaningful impact (>20% of total OR top 30%)
 *
 * Selection Rules:
 * 1. Max 2 categories (to avoid UI clutter)
 * 2. Category must have meaningful impact:
 *    - Total >= 20% of all expenses OR
 *    - Category is in top 30% of all categories by amount
 * 3. If one category dominates (>60%), return only that one
 * 4. Edge cases:
 *    - Empty expenses → return []
 *    - <2 categories total → return all
 *
 * @param expenses - Array of expenses
 * @param categories - Array of category definitions
 * @returns Array of top 1-2 categories sorted by total amount (desc)
 */
export function calculateTopSpendingCategories(
  expenses: Expense[],
  categories: Category[]
): TopCategoryResult[] {
  // Edge case: No expenses
  if (expenses.length === 0) {
    return []
  }

  // Step 1: Group expenses by category and calculate totals
  const categoryTotals = new Map<string, number>()
  let grandTotal = 0

  expenses.forEach((expense) => {
    if (!expense.categoryId) return // Skip uncategorized expenses

    const current = categoryTotals.get(expense.categoryId) || 0
    categoryTotals.set(expense.categoryId, current + expense.amount)
    grandTotal += expense.amount
  })

  // Edge case: No categorized expenses
  if (categoryTotals.size === 0 || grandTotal === 0) {
    return []
  }

  // Step 2: Convert to array with percentages and sort by amount (desc)
  const categoryResults: TopCategoryResult[] = Array.from(categoryTotals.entries())
    .map(([categoryId, totalAmount]) => {
      const category = categories.find((c) => c.id === categoryId)
      const percentage = Math.round((totalAmount / grandTotal) * 100)

      return {
        categoryId,
        categoryName: category?.name || 'نامشخص',
        categoryIcon: category?.icon,
        categoryColor: category?.color,
        totalAmount,
        percentage,
      }
    })
    .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by amount descending

  // Edge case: Fewer than 2 categories total
  if (categoryResults.length <= 2) {
    return categoryResults
  }

  // Step 3: Apply selection rules to pick top 1-2 categories

  const MEANINGFUL_THRESHOLD = 20 // Category must be >= 20% of total
  const DOMINANCE_THRESHOLD = 60 // If one category is >60%, show only that one
  const TOP_PERCENTILE_THRESHOLD = 0.3 // Top 30% of categories

  // Check if top category dominates (>60%)
  const topCategory = categoryResults[0]
  if (topCategory.percentage > DOMINANCE_THRESHOLD) {
    // One category dominates - return only that one
    return [topCategory]
  }

  // Filter categories by meaningful impact
  const top30PercentileIndex = Math.max(
    0,
    Math.ceil(categoryResults.length * TOP_PERCENTILE_THRESHOLD) - 1
  )
  const top30PercentileThreshold = categoryResults[top30PercentileIndex]?.totalAmount || 0

  const meaningfulCategories = categoryResults.filter((cat) => {
    // Include if category is >= 20% of total OR in top 30% of categories
    return (
      cat.percentage >= MEANINGFUL_THRESHOLD ||
      cat.totalAmount >= top30PercentileThreshold
    )
  })

  // Return top 2 meaningful categories (already sorted by amount desc)
  return meaningfulCategories.slice(0, 2)
}

// ============================================
// Helper: Get Heavy Expenses
// ============================================

export interface HeavyExpensesResult {
  /** List of heavy expenses (top 20% by amount) */
  heavyExpenses: Expense[]
  /** Metadata about heavy expenses */
  meta: {
    /** Number of heavy expenses */
    count: number
    /** Total amount of heavy expenses */
    totalHeavyAmount: number
    /** Percentage of total spend that heavy expenses represent (0-100) */
    percentageOfTotalSpend: number
  }
}

/**
 * Get Heavy Expenses (Top 20% by Amount)
 *
 * Definition Rules:
 * - Sort expenses by amount descending
 * - Select top 20% of items (rounded UP using Math.ceil)
 * - Always select at least 1 expense (if list is not empty)
 * - If multiple expenses have same amount at cutoff → include ALL of them
 *
 * Edge Cases:
 * - Empty list → return empty array
 * - 1 expense → it is heavy by default
 * - Equal amounts at cutoff → include all (don't split arbitrarily)
 *
 * Examples:
 * - 10 expenses → top 2 are heavy (Math.ceil(10 * 0.2) = 2)
 * - 7 expenses → top 2 are heavy (Math.ceil(7 * 0.2) = 2)
 * - 3 expenses → top 1 is heavy (Math.ceil(3 * 0.2) = 1)
 *
 * UX Intent:
 * - Help users focus on high-impact spending
 * - Top 20% typically represents 60-80% of total spend (Pareto principle)
 * - Quick decision-making without overwhelming analytics
 *
 * @param expenses - Array of expenses
 * @returns Heavy expenses with metadata
 */
export function getHeavyExpenses(expenses: Expense[]): HeavyExpensesResult {
  // Edge case: empty list
  if (expenses.length === 0) {
    return {
      heavyExpenses: [],
      meta: {
        count: 0,
        totalHeavyAmount: 0,
        percentageOfTotalSpend: 0,
      },
    }
  }

  // Step 1: Sort by amount descending
  const sorted = [...expenses].sort((a, b) => b.amount - a.amount)

  // Step 2: Calculate how many to include (round UP, minimum 1)
  const top20Count = Math.max(1, Math.ceil(sorted.length * 0.2))

  // Step 3: Get the cutoff amount (amount at index top20Count - 1)
  const cutoffAmount = sorted[top20Count - 1]?.amount || 0

  // Step 4: Include ALL expenses >= cutoff amount (handles equal amounts at cutoff)
  const heavyExpenses = expenses.filter((e) => e.amount >= cutoffAmount)

  // Step 5: Calculate metadata
  const totalHeavyAmount = heavyExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const percentageOfTotalSpend = totalAmount > 0 ? Math.round((totalHeavyAmount / totalAmount) * 100) : 0

  return {
    heavyExpenses,
    meta: {
      count: heavyExpenses.length,
      totalHeavyAmount,
      percentageOfTotalSpend,
    },
  }
}

// ============================================
// Helper: Calculate Heavy Expenses Threshold
// ============================================

/**
 * Calculate threshold for "heavy" expenses (top 20%)
 *
 * Uses Math.ceil to round up (matches getHeavyExpenses logic).
 *
 * @param expenses - Array of expenses
 * @returns Minimum amount to be considered "heavy" (0 if no expenses)
 */
export function calculateHeavyExpenseThreshold(expenses: Expense[]): number {
  if (expenses.length === 0) return 0

  // Sort by amount descending
  const sorted = [...expenses].sort((a, b) => b.amount - a.amount)

  // Calculate top 20% count (round UP, minimum 1)
  const top20Count = Math.max(1, Math.ceil(sorted.length * 0.2))

  // Return the cutoff amount (amount at index top20Count - 1)
  return sorted[top20Count - 1]?.amount || 0
}

// ============================================
// Helper: Count Heavy Expenses
// ============================================

/**
 * Count how many expenses are considered "heavy" (top 20% by amount)
 *
 * Note: This may return more than top20Count if there are equal amounts at cutoff.
 *
 * @param expenses - Array of expenses
 * @returns Number of heavy expenses
 */
export function countHeavyExpenses(expenses: Expense[]): number {
  const threshold = calculateHeavyExpenseThreshold(expenses)
  return expenses.filter((e) => e.amount >= threshold).length
}
