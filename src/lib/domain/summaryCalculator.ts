// Summary Calculator
// Calculates balances and optimal settlements

import type { ParticipantBalance, Settlement, ProjectSummary } from '@/lib/types/domain'

interface ExpenseData {
  id: string
  amount: number
  paidById: string
  shares: {
    participantId: string
    amount: number
  }[]
}

interface ParticipantData {
  id: string
  name: string
}

interface CalculateInput {
  projectId: string
  projectName: string
  currency: string
  expenses: ExpenseData[]
  participants: ParticipantData[]
}

/**
 * محاسبه موجودی هر شرکت‌کننده
 * balance مثبت = طلبکار، منفی = بدهکار
 */
export function calculateBalances(
  expenses: ExpenseData[],
  participants: ParticipantData[]
): ParticipantBalance[] {
  const balanceMap = new Map<string, { paid: number; share: number }>()

  // Initialize all participants
  participants.forEach((p) => {
    balanceMap.set(p.id, { paid: 0, share: 0 })
  })

  // Calculate totals from expenses
  expenses.forEach((expense) => {
    // Add to paid amount
    const payer = balanceMap.get(expense.paidById)
    if (payer) {
      payer.paid += expense.amount
    }

    // Add shares
    expense.shares.forEach((share) => {
      const participant = balanceMap.get(share.participantId)
      if (participant) {
        participant.share += share.amount
      }
    })
  })

  // Convert to result format
  return participants.map((p) => {
    const data = balanceMap.get(p.id) || { paid: 0, share: 0 }
    return {
      participantId: p.id,
      participantName: p.name,
      totalPaid: data.paid,
      totalShare: data.share,
      balance: data.paid - data.share, // مثبت = طلبکار
    }
  })
}

/**
 * الگوریتم بهینه‌سازی تسویه
 * کمترین تعداد تراکنش برای صفر کردن بدهی‌ها
 */
export function calculateOptimalSettlements(
  balances: ParticipantBalance[]
): Settlement[] {
  const settlements: Settlement[] = []

  // جدا کردن طلبکاران و بدهکاران
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance) // بزرگترین طلبکار اول

  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
    .sort((a, b) => b.balance - a.balance) // بزرگترین بدهکار اول

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]

    const amount = Math.min(creditor.balance, debtor.balance)

    if (amount > 0.01) {
      settlements.push({
        fromId: debtor.participantId,
        fromName: debtor.participantName,
        toId: creditor.participantId,
        toName: creditor.participantName,
        amount: Math.round(amount), // گرد کردن به تومان
      })
    }

    creditor.balance -= amount
    debtor.balance -= amount

    if (creditor.balance < 0.01) i++
    if (debtor.balance < 0.01) j++
  }

  return settlements
}

/**
 * محاسبه خلاصه کامل پروژه
 */
export function calculateProjectSummary(input: CalculateInput): ProjectSummary {
  const { projectId, projectName, currency, expenses, participants } = input

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const participantBalances = calculateBalances(expenses, participants)
  const settlements = calculateOptimalSettlements(participantBalances)

  return {
    projectId,
    projectName,
    totalExpenses,
    currency,
    participantBalances,
    settlements,
  }
}
