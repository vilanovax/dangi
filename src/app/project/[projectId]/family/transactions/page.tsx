'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TransactionDetailSheet } from '../components'
import { designTokens as dt } from '@/styles/design-tokens'
import {
  familyTheme,
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'
import { FamilyIcon } from '../components/FamilyIcon'

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
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header - Minimal */}
      <div
        className={`text-white shadow-lg sticky top-0 z-10 ${getHeaderGradient('primary')}`}
        style={{ padding: dt.spacing[5] }}
      >
        <div
          className="flex items-center"
          style={{
            gap: dt.spacing[3],
            marginBottom: dt.spacing[3]
          }}
        >
          <Link
            href={`/project/${projectId}/family`}
            className="text-white hover:bg-white/20 rounded-full transition-colors"
            style={{ padding: dt.spacing[2] }}
            aria-label="بازگشت"
          >
            <FamilyIcon name="back" size={24} className="text-white" />
          </Link>
          <div>
            <h1
              className="font-bold"
              style={{ fontSize: dt.typography.sizes.headline }}
            >
              تراکنش‌ها
            </h1>
            <p
              className="text-white/80 mt-0.5"
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              همه تراکنش‌های این ماه
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex overflow-x-auto pb-1 scrollbar-hide" style={{ gap: dt.spacing[2] }}>
          <button
            onClick={() => setFilter('all')}
            className="flex-shrink-0 rounded-full font-medium transition-all"
            style={{
              paddingLeft: dt.spacing[4],
              paddingRight: dt.spacing[4],
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: dt.typography.sizes.caption,
              backgroundColor: filter === 'all' ? 'white' : 'rgba(255, 255, 255, 0.2)',
              color: filter === 'all' ? dt.colors.brand.primary : 'white',
              boxShadow: filter === 'all' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            همه
          </button>
          <button
            onClick={() => setFilter('expense')}
            className="flex-shrink-0 rounded-full font-medium transition-all"
            style={{
              paddingLeft: dt.spacing[4],
              paddingRight: dt.spacing[4],
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: dt.typography.sizes.caption,
              backgroundColor: filter === 'expense' ? 'white' : 'rgba(255, 255, 255, 0.2)',
              color: filter === 'expense' ? dt.colors.semantic.expense : 'white',
              boxShadow: filter === 'expense' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            هزینه‌ها
          </button>
          <button
            onClick={() => setFilter('income')}
            className="flex-shrink-0 rounded-full font-medium transition-all"
            style={{
              paddingLeft: dt.spacing[4],
              paddingRight: dt.spacing[4],
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: dt.typography.sizes.caption,
              backgroundColor: filter === 'income' ? 'white' : 'rgba(255, 255, 255, 0.2)',
              color: filter === 'income' ? dt.colors.semantic.income : 'white',
              boxShadow: filter === 'income' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            درآمدها
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: dt.spacing[4] }}>
        {/* Count Badge */}
        {!loading && totalCount > 0 && (
          <div className="text-center" style={{ marginBottom: dt.spacing[3] }}>
            <span
              className={`inline-block rounded-full shadow-sm ${getCardBackgroundClass()} ${getTextColorClass('secondary')}`}
              style={{
                paddingLeft: dt.spacing[3],
                paddingRight: dt.spacing[3],
                paddingTop: dt.spacing[1],
                paddingBottom: dt.spacing[1],
                fontSize: dt.typography.sizes.caption
              }}
            >
              {totalCount} تراکنش پیدا شد
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center" style={{ paddingTop: 64, paddingBottom: 64 }}>
            <div
              className="inline-block animate-spin rounded-full h-10 w-10 border-4"
              style={{
                borderColor: dt.colors.brand.primarySoft,
                borderTopColor: dt.colors.brand.primary
              }}
            ></div>
            <p
              className={`${getTextColorClass('secondary')}`}
              style={{
                marginTop: dt.spacing[4],
                fontSize: dt.typography.sizes.body
              }}
            >
              در حال دریافت تراکنش‌ها…
            </p>
          </div>
        ) : totalCount === 0 ? (
          <div
            className={`text-center shadow-lg ${getCardBackgroundClass()}`}
            style={{
              borderRadius: dt.radius.xl,
              padding: dt.spacing[8] * 1.5
            }}
          >
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{
                marginBottom: dt.spacing[4],
                backgroundColor: dt.colors.brand.primarySoft
              }}
            >
              <FamilyIcon name="emptyList" size={36} style={{ color: dt.colors.brand.primary }} />
            </div>
            <p
              className={`font-medium mb-1 ${getTextColorClass('primary')}`}
              style={{ fontSize: dt.typography.sizes.body }}
            >
              هنوز تراکنشی ثبت نشده
            </p>
            <p
              className={getTextColorClass('secondary')}
              style={{ fontSize: dt.typography.sizes.caption }}
            >
              از دکمه + شروع کن
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[4] }}>
            {Object.entries(processedTransactions).map(([timeGroup, items]) => (
              <div key={timeGroup}>
                {/* Time Group Header */}
                <div
                  className={`font-medium ${getTextColorClass('secondary')}`}
                  style={{
                    paddingLeft: dt.spacing[2],
                    paddingRight: dt.spacing[2],
                    marginBottom: dt.spacing[2],
                    fontSize: dt.typography.sizes.caption
                  }}
                >
                  {timeGroup}
                </div>

                {/* Transactions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[2] }}>
                  {items.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleTransactionClick(transaction)}
                      className={`hover:shadow-lg transition-shadow cursor-pointer active:scale-98 shadow-sm ${getCardBackgroundClass()}`}
                      style={{
                        borderRadius: dt.radius.lg,
                        padding: dt.spacing[3]
                      }}
                    >
                      <div className="flex items-center" style={{ gap: dt.spacing[3] }}>
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: transaction.type === 'INCOME'
                              ? 'rgba(234, 251, 241, 1)'
                              : 'rgba(254, 236, 236, 1)'
                          }}
                        >
                          {transaction.categoryIcon ? (
                            <span style={{ fontSize: dt.typography.sizes.bodyLarge }}>{transaction.categoryIcon}</span>
                          ) : (
                            <FamilyIcon
                              name={transaction.type === 'INCOME' ? 'income' : 'expense'}
                              size={20}
                              style={{
                                color: transaction.type === 'INCOME' ? dt.colors.semantic.income : dt.colors.semantic.expense
                              }}
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-semibold truncate ${getTextColorClass('primary')}`}
                            style={{ fontSize: dt.typography.sizes.body }}
                          >
                            {transaction.title}
                          </div>
                          <div
                            className="flex items-center mt-0.5"
                            style={{ gap: 6 }}
                          >
                            {transaction.count > 1 && (
                              <>
                                <span
                                  className={`font-medium ${getTextColorClass('secondary')}`}
                                  style={{ fontSize: 10 }}
                                >
                                  {transaction.count} بار
                                </span>
                                <span
                                  className="text-gray-400 dark:text-gray-600"
                                  style={{ fontSize: 8 }}
                                >
                                  •
                                </span>
                              </>
                            )}
                            {transaction.categoryName && (
                              <span
                                className={getTextColorClass('secondary')}
                                style={{ fontSize: 10 }}
                              >
                                {transaction.categoryName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-left flex-shrink-0">
                          <div
                            className={`font-bold ${
                              transaction.type === 'INCOME'
                                ? getTextColorClass('success')
                                : getTextColorClass('danger')
                            }`}
                            style={{ fontSize: dt.typography.sizes.body }}
                          >
                            {transaction.type === 'INCOME' ? '+' : '−'}
                            {(transaction.totalAmount / 10).toLocaleString('fa-IR')}
                          </div>
                          {transaction.count > 1 && (
                            <div
                              className="text-gray-400 dark:text-gray-600"
                              style={{ fontSize: 9 }}
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
