/**
 * Category Breakdown Types
 * برای نمایش تفکیک خرج‌ها بر اساس دسته‌بندی در gathering template
 */

export interface CategoryBreakdown {
  categoryId: string | null
  categoryName: string
  categoryIcon: string
  categoryColor: string
  totalAmount: number
  expenseCount: number
  percentage: number
}

/**
 * Participant Expense Breakdown
 * برای نمایش اینکه هر شرکت‌کننده چقدر خرج پرداخت کرده (به عنوان paidBy)
 */
export interface ParticipantExpenseBreakdown {
  participantId: string
  participantName: string
  participantAvatar: string | null
  totalExpenses: number
  expenseCount: number
  percentage: number
}
