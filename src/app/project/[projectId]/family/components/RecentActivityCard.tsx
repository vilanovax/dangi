'use client'

import { familyTheme } from '@/styles/family-theme'

// Simple relative time formatter
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'همین الان'
  if (diffMins < 60) return `${diffMins} دقیقه پیش`
  if (diffHours < 24) return `${diffHours} ساعت پیش`
  if (diffDays < 7) return `${diffDays} روز پیش`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} ماه پیش`
  return `${Math.floor(diffDays / 365)} سال پیش`
}

interface Transaction {
  id: string
  title: string
  amount: number
  date: Date
  type: 'INCOME' | 'EXPENSE'
  categoryName?: string
  categoryIcon?: string
  personName: string
}

interface RecentActivityCardProps {
  recentIncomes?: Array<{
    id: string
    title: string
    amount: number
    date: Date
    categoryName?: string
    categoryIcon?: string
    receivedByName: string
  }>
  recentExpenses?: Array<{
    id: string
    title: string
    amount: number
    date: Date
    categoryName?: string
    categoryIcon?: string
    paidByName: string
  }>
  currency?: string
  projectId?: string
}

export function RecentActivityCard({
  recentIncomes = [],
  recentExpenses = [],
  currency = 'تومان',
}: RecentActivityCardProps) {
  // Combine and sort by date
  const allTransactions: Transaction[] = [
    ...recentIncomes.map((income) => ({
      id: income.id,
      title: income.title,
      amount: income.amount,
      date: income.date,
      type: 'INCOME' as const,
      categoryName: income.categoryName,
      categoryIcon: income.categoryIcon,
      personName: income.receivedByName,
    })),
    ...recentExpenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      type: 'EXPENSE' as const,
      categoryName: expense.categoryName,
      categoryIcon: expense.categoryIcon,
      personName: expense.paidByName,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div
      className="h-screen w-full flex flex-col p-6 snap-start overflow-hidden"
      style={{ backgroundColor: familyTheme.colors.background }}
    >
      {/* Header */}
      <div className="text-center mb-6 pt-6">
        <h2
          className="font-bold mb-2"
          style={{
            fontSize: '28px',
            fontWeight: familyTheme.typography.pageTitle.weight,
            color: familyTheme.colors.textPrimary
          }}
        >
          فعالیت اخیر
        </h2>
        <p
          style={{
            fontSize: familyTheme.typography.body.size,
            color: familyTheme.colors.textSecondary
          }}
        >
          {allTransactions.length} تراکنش اخیر
        </p>
      </div>

      {/* Transactions list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {allTransactions.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow
            }}
          >
            <span className="text-5xl mb-4 block">📋</span>
            <p
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              هنوز تراکنشی ثبت نشده است
            </p>
          </div>
        ) : (
          allTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="rounded-2xl p-4"
              style={{
                backgroundColor:
                  transaction.type === 'INCOME'
                    ? familyTheme.colors.successSoft
                    : familyTheme.colors.dangerSoft,
                boxShadow: familyTheme.card.shadow
              }}
            >
              <div className="flex items-start justify-between">
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        transaction.type === 'INCOME'
                          ? familyTheme.colors.success + '40'
                          : familyTheme.colors.danger + '40'
                    }}
                  >
                    <span className="text-lg">
                      {transaction.categoryIcon ||
                        (transaction.type === 'INCOME' ? '💰' : '💸')}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div
                      className="font-medium mb-1"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        color: familyTheme.colors.textPrimary
                      }}
                    >
                      {transaction.title}
                    </div>
                    <div
                      className="space-x-reverse space-x-2"
                      style={{
                        fontSize: familyTheme.typography.small.size,
                        color: familyTheme.colors.textSecondary
                      }}
                    >
                      {transaction.categoryName && (
                        <span>{transaction.categoryName}</span>
                      )}
                      <span>·</span>
                      <span>{transaction.personName}</span>
                      <span>·</span>
                      <span>{getRelativeTime(transaction.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-left">
                  <div
                    className="font-bold"
                    style={{
                      fontSize: familyTheme.typography.subtitle.size,
                      color:
                        transaction.type === 'INCOME'
                          ? familyTheme.colors.success
                          : familyTheme.colors.danger
                    }}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {transaction.amount.toLocaleString('fa-IR')}
                  </div>
                  <div
                    style={{
                      fontSize: familyTheme.typography.small.size,
                      color: familyTheme.colors.textSecondary
                    }}
                  >
                    {currency}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-6" />
    </div>
  )
}
