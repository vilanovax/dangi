import { describe, expect, it } from 'vitest'
import { buildQuickEditExpenseUpdates } from './quick-edit-updates'

describe('buildQuickEditExpenseUpdates', () => {
  const expense = {
    amount: 120000,
    title: 'ناهار',
    paidById: 'participant-a',
    categoryId: 'food',
  }

  it('omits amount when it did not change', () => {
    const updates = buildQuickEditExpenseUpdates(expense, {
      amount: 120000,
      title: 'شام',
      paidById: 'participant-a',
      categoryId: 'food',
    })

    expect(updates).toEqual({
      title: 'شام',
      paidById: 'participant-a',
      categoryId: 'food',
    })
  })

  it('includes amount when it changed', () => {
    const updates = buildQuickEditExpenseUpdates(expense, {
      amount: 150000,
      title: 'ناهار',
      paidById: 'participant-a',
      categoryId: 'food',
    })

    expect(updates.amount).toBe(150000)
  })
})
