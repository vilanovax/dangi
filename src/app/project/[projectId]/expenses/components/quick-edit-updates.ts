export interface QuickEditExpenseSnapshot {
  amount: number
  title: string
  paidById: string
  categoryId?: string | null
}

export interface QuickEditExpenseUpdates {
  amount?: number
  categoryId: string | null
  paidById: string
  title: string
}

export function buildQuickEditExpenseUpdates(
  expense: QuickEditExpenseSnapshot,
  form: {
    amount: number
    categoryId: string | null
    paidById: string
    title: string
  }
): QuickEditExpenseUpdates {
  const updates: QuickEditExpenseUpdates = {
    categoryId: form.categoryId,
    paidById: form.paidById,
    title: form.title.trim() || expense.title,
  }

  if (form.amount !== expense.amount) {
    updates.amount = form.amount
  }

  return updates
}
