'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TransactionDetailSheet } from '../components'
import { familyTheme } from '@/styles/family-theme'

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

interface AggregatedTransaction {
  id: string
  title: string
  amount: number
  date: Date
  type: 'INCOME' | 'EXPENSE'
  categoryName?: string
  categoryIcon?: string
  personName: string
  count: number
  totalAmount: number
}

export default function TransactionsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>(
    (searchParams.get('filter') as 'income' | 'expense') || 'all'
  )
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [projectId])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      const [incomesRes, expensesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/incomes?limit=50`),
        fetch(`/api/projects/${projectId}/expenses?limit=50`),
      ])

      const incomesData = await incomesRes.json()
      const expensesData = await expensesRes.json()

      const allTransactions: Transaction[] = [
        ...(incomesData.incomes || []).map((income: any) => ({
          id: income.id,
          title: income.title,
          amount: income.amount,
          date: new Date(income.incomeDate),
          type: 'INCOME' as const,
          categoryName: income.category?.name,
          categoryIcon: income.category?.icon,
          personName: income.receivedBy.name,
        })),
        ...(expensesData.expenses || []).map((expense: any) => ({
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          date: new Date(expense.expenseDate),
          type: 'EXPENSE' as const,
          categoryName: expense.category?.name,
          categoryIcon: expense.category?.icon,
          personName: expense.paidBy.name,
        })),
      ]

      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())
      setTransactions(allTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setSelectedTransaction(null)
  }

  const handleDeleteSuccess = () => {
    // Refresh the transactions list after successful deletion
    fetchTransactions()
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'income' && t.type !== 'INCOME') return false
    if (filter === 'expense' && t.type !== 'EXPENSE') return false
    return true
  })

  // Get time-based group label
  const getTimeGroupLabel = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

    if (diffDays === 0) return 'امروز'
    if (diffDays === 1) return 'دیروز'
    if (diffDays === 2) return '۲ روز پیش'
    if (diffDays === 3) return '۳ روز پیش'
    if (diffDays < 7) return `${diffDays} روز پیش`
    if (diffDays < 14) return 'هفته گذشته'
    if (diffDays < 21) return '۲ هفته پیش'
    if (diffDays < 30) return '۳ هفته پیش'

    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const faDate = date.toLocaleDateString('fa-IR-u-nu-latn').split('/')
    const month = parseInt(faDate[1])
    return `اوایل ${monthNames[month - 1]}`
  }

  // Group by time and aggregate similar transactions
  const processedTransactions = (() => {
    const grouped: Record<string, AggregatedTransaction[]> = {}

    filteredTransactions.forEach((transaction, index) => {
      const groupKey = getTimeGroupLabel(transaction.date)

      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }

      const dayKey = transaction.date.toDateString()
      const lastInGroup = grouped[groupKey][grouped[groupKey].length - 1]

      // Aggregate if same title, category, type, and same day
      const shouldAggregate =
        lastInGroup &&
        lastInGroup.title === transaction.title &&
        lastInGroup.categoryName === transaction.categoryName &&
        lastInGroup.type === transaction.type &&
        lastInGroup.date.toDateString() === dayKey

      if (shouldAggregate) {
        lastInGroup.count += 1
        lastInGroup.totalAmount += transaction.amount
      } else {
        grouped[groupKey].push({
          ...transaction,
          count: 1,
          totalAmount: transaction.amount,
        })
      }
    })

    return grouped
  })()

  const totalCount = filteredTransactions.length

  return (
    <div className="min-h-screen" style={{ backgroundColor: familyTheme.colors.background }}>
      {/* Header - Minimal */}
      <div
        className="text-white p-5 shadow-lg sticky top-0 z-10"
        style={{ background: familyTheme.gradients.primaryHeader }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            →
          </Link>
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: familyTheme.typography.pageTitle.size,
                fontWeight: familyTheme.typography.pageTitle.weight
              }}
            >
              تراکنش‌ها
            </h1>
            <p
              className="text-white/80 mt-0.5"
              style={{ fontSize: familyTheme.typography.small.size }}
            >
              همه تراکنش‌های این ماه
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className="flex-shrink-0 px-4 py-1.5 rounded-full font-medium transition-all"
            style={{
              fontSize: familyTheme.typography.small.size,
              backgroundColor: filter === 'all' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
              color: filter === 'all' ? familyTheme.colors.primary : '#FFFFFF',
              boxShadow: filter === 'all' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            همه
          </button>
          <button
            onClick={() => setFilter('expense')}
            className="flex-shrink-0 px-4 py-1.5 rounded-full font-medium transition-all"
            style={{
              fontSize: familyTheme.typography.small.size,
              backgroundColor: filter === 'expense' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
              color: filter === 'expense' ? familyTheme.colors.danger : '#FFFFFF',
              boxShadow: filter === 'expense' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            هزینه‌ها
          </button>
          <button
            onClick={() => setFilter('income')}
            className="flex-shrink-0 px-4 py-1.5 rounded-full font-medium transition-all"
            style={{
              fontSize: familyTheme.typography.small.size,
              backgroundColor: filter === 'income' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
              color: filter === 'income' ? familyTheme.colors.success : '#FFFFFF',
              boxShadow: filter === 'income' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            درآمدها
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Count Badge */}
        {!loading && totalCount > 0 && (
          <div className="mb-3 text-center">
            <span
              className="inline-block px-3 py-1 rounded-full"
              style={{
                backgroundColor: familyTheme.colors.card,
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              {totalCount} تراکنش پیدا شد
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div
              className="inline-block animate-spin rounded-full h-10 w-10 border-4"
              style={{
                borderColor: familyTheme.colors.primarySoft,
                borderTopColor: familyTheme.colors.primary
              }}
            ></div>
            <p
              className="mt-4"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              در حال دریافت تراکنش‌ها…
            </p>
          </div>
        ) : totalCount === 0 ? (
          <div
            className="rounded-3xl p-12 text-center"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow,
              borderRadius: familyTheme.card.borderRadius
            }}
          >
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: familyTheme.colors.primarySoft }}
            >
              <span className="text-4xl">📋</span>
            </div>
            <p
              className="font-medium mb-1"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textPrimary
              }}
            >
              هنوز تراکنشی ثبت نشده
            </p>
            <p
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              از دکمه + شروع کن
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(processedTransactions).map(([timeGroup, items]) => (
              <div key={timeGroup}>
                {/* Time Group Header */}
                <div
                  className="font-medium px-2 mb-2"
                  style={{
                    fontSize: familyTheme.typography.small.size,
                    color: familyTheme.colors.textSecondary
                  }}
                >
                  {timeGroup}
                </div>

                {/* Transactions */}
                <div className="space-y-2">
                  {items.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleTransactionClick(transaction)}
                      className="rounded-xl p-3 hover:shadow-lg transition-shadow cursor-pointer active:scale-98"
                      style={{
                        backgroundColor: familyTheme.colors.card,
                        boxShadow: familyTheme.card.shadow,
                        borderRadius: familyTheme.card.borderRadius
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor:
                              transaction.type === 'INCOME'
                                ? familyTheme.colors.successSoft
                                : familyTheme.colors.dangerSoft
                          }}
                        >
                          <span className="text-base">
                            {transaction.categoryIcon ||
                              (transaction.type === 'INCOME' ? '💰' : '💸')}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-semibold truncate"
                            style={{
                              fontSize: familyTheme.typography.body.size,
                              color: familyTheme.colors.textPrimary
                            }}
                          >
                            {transaction.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {transaction.count > 1 && (
                              <>
                                <span
                                  className="font-medium"
                                  style={{
                                    fontSize: '10px',
                                    color: familyTheme.colors.textSecondary
                                  }}
                                >
                                  {transaction.count} بار
                                </span>
                                <span
                                  style={{
                                    fontSize: '8px',
                                    color: familyTheme.colors.textTertiary
                                  }}
                                >
                                  •
                                </span>
                              </>
                            )}
                            {transaction.categoryName && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: familyTheme.colors.textSecondary
                                }}
                              >
                                {transaction.categoryName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-left flex-shrink-0">
                          <div
                            className="font-bold"
                            style={{
                              fontSize: familyTheme.typography.body.size,
                              color:
                                transaction.type === 'INCOME'
                                  ? familyTheme.colors.success
                                  : familyTheme.colors.danger
                            }}
                          >
                            {transaction.type === 'INCOME' ? '+' : '−'}
                            {(transaction.totalAmount / 10).toLocaleString('fa-IR')}
                          </div>
                          {transaction.count > 1 && (
                            <div
                              style={{
                                fontSize: '9px',
                                color: familyTheme.colors.textTertiary
                              }}
                            >
                              جمع {transaction.count} مورد
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Bottom Sheet */}
      <TransactionDetailSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        transaction={selectedTransaction}
        projectId={projectId}
        onDelete={handleDeleteSuccess}
      />
    </div>
  )
}
