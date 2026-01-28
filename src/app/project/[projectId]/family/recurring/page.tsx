'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { familyTheme } from '@/styles/family-theme'

interface RecurringTransaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  title: string
  amount: number
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  isActive: boolean
  startDate: string
  endDate: string | null
  participant: {
    id: string
    name: string
  }
  category: {
    id: string
    name: string
    icon?: string | null
  } | null
}

export default function RecurringTransactionsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [transactions, setTransactions] = useState<RecurringTransaction[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const frequencyLabels = {
    DAILY: 'روزانه',
    WEEKLY: 'هفتگی',
    MONTHLY: 'ماهانه',
    YEARLY: 'سالانه',
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/recurring`)
      if (!res.ok) throw new Error('خطا در دریافت تراکنش‌ها')

      const data = await res.json()
      setTransactions(data.recurring || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/recurring/${id}/toggle`,
        { method: 'POST' }
      )

      if (!res.ok) throw new Error('خطا در تغییر وضعیت')

      // Refresh list
      await fetchTransactions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در تغییر وضعیت')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`آیا از حذف "${title}" اطمینان دارید؟`)) return

    try {
      const res = await fetch(`/api/projects/${projectId}/recurring/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('خطا در حذف')

      // Refresh list
      await fetchTransactions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف')
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'active') return t.isActive
    if (filter === 'inactive') return !t.isActive
    return true
  })

  const activeCount = transactions.filter((t) => t.isActive).length
  const inactiveCount = transactions.filter((t) => !t.isActive).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: familyTheme.colors.background }}>
      {/* Header */}
      <div
        className="text-white p-6 shadow-lg"
        style={{ background: familyTheme.gradients.infoHeader }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ←
            </button>
            <div>
              <h1
                className="font-bold"
                style={{
                  fontSize: familyTheme.typography.pageTitle.size,
                  fontWeight: familyTheme.typography.pageTitle.weight
                }}
              >
                تراکنش‌های تکراری
              </h1>
              <p
                className="text-white/90"
                style={{ fontSize: familyTheme.typography.body.size }}
              >
                {activeCount} فعال · {inactiveCount} غیرفعال
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              router.push(`/project/${projectId}/family/recurring/add`)
            }
            className="bg-white px-4 py-2 rounded-full font-medium hover:opacity-90 transition-opacity"
            style={{
              color: familyTheme.colors.info,
              fontSize: familyTheme.typography.body.size
            }}
          >
            + افزودن
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div
        className="border-b sticky top-0 z-10"
        style={{
          backgroundColor: familyTheme.colors.card,
          borderColor: familyTheme.colors.divider
        }}
      >
        <div className="flex gap-2 p-4 max-w-2xl mx-auto">
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-full font-medium transition-colors"
            style={{
              fontSize: familyTheme.typography.small.size,
              backgroundColor: filter === 'all' ? familyTheme.colors.info : familyTheme.colors.background,
              color: filter === 'all' ? '#FFFFFF' : familyTheme.colors.textSecondary
            }}
          >
            همه ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className="px-4 py-2 rounded-full font-medium transition-colors"
            style={{
              fontSize: familyTheme.typography.small.size,
              backgroundColor: filter === 'active' ? familyTheme.colors.success : familyTheme.colors.background,
              color: filter === 'active' ? '#FFFFFF' : familyTheme.colors.textSecondary
            }}
          >
            فعال ({activeCount})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className="px-4 py-2 rounded-full font-medium transition-colors"
            style={{
              fontSize: familyTheme.typography.small.size,
              backgroundColor: filter === 'inactive' ? familyTheme.colors.textSecondary : familyTheme.colors.background,
              color: filter === 'inactive' ? '#FFFFFF' : familyTheme.colors.textSecondary
            }}
          >
            غیرفعال ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div
            className="text-center py-12"
            style={{ color: familyTheme.colors.textSecondary }}
          >
            در حال بارگذاری...
          </div>
        ) : error ? (
          <div
            className="px-4 py-3 rounded-xl"
            style={{
              backgroundColor: familyTheme.colors.dangerSoft,
              border: `1px solid ${familyTheme.colors.danger}33`,
              color: familyTheme.colors.danger
            }}
          >
            {error}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow
            }}
          >
            <span className="text-6xl mb-4 block">🔄</span>
            <p
              className="mb-4"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              {filter === 'all'
                ? 'هنوز تراکنش تکراری ثبت نشده است'
                : filter === 'active'
                  ? 'تراکنش تکراری فعالی وجود ندارد'
                  : 'تراکنش تکراری غیرفعالی وجود ندارد'}
            </p>
            {filter === 'all' && (
              <Button
                onClick={() =>
                  router.push(`/project/${projectId}/family/recurring/add`)
                }
                className="text-white px-6 py-2 rounded-full"
                style={{
                  backgroundColor: familyTheme.colors.info,
                  fontSize: familyTheme.typography.body.size
                }}
              >
                افزودن اولین تراکنش
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`rounded-2xl p-4 transition-all ${
                  transaction.isActive ? 'opacity-100' : 'opacity-60'
                }`}
                style={{
                  backgroundColor: familyTheme.colors.card,
                  boxShadow: familyTheme.card.shadow
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {transaction.category?.icon && (
                        <span className="text-xl">
                          {transaction.category.icon}
                        </span>
                      )}
                      <span
                        className="font-bold"
                        style={{ color: familyTheme.colors.textPrimary }}
                      >
                        {transaction.title}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          fontSize: familyTheme.typography.small.size,
                          backgroundColor:
                            transaction.type === 'INCOME'
                              ? familyTheme.colors.successSoft
                              : familyTheme.colors.dangerSoft,
                          color:
                            transaction.type === 'INCOME'
                              ? familyTheme.colors.success
                              : familyTheme.colors.danger
                        }}
                      >
                        {transaction.type === 'INCOME' ? 'درآمد' : 'هزینه'}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-4 mb-2"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        color: familyTheme.colors.textSecondary
                      }}
                    >
                      <div>
                        <span
                          className="font-bold"
                          style={{ color: familyTheme.colors.textPrimary }}
                        >
                          {transaction.amount.toLocaleString('fa-IR')}
                        </span>{' '}
                        تومان
                      </div>
                      <div>·</div>
                      <div>{frequencyLabels[transaction.frequency]}</div>
                      <div>·</div>
                      <div>{transaction.participant.name}</div>
                    </div>

                    {transaction.category && (
                      <div
                        style={{
                          fontSize: familyTheme.typography.small.size,
                          color: familyTheme.colors.textSecondary
                        }}
                      >
                        {transaction.category.name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(transaction.id)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{
                        backgroundColor: transaction.isActive
                          ? familyTheme.colors.success
                          : familyTheme.colors.divider
                      }}
                      title={
                        transaction.isActive
                          ? 'کلیک برای غیرفعال کردن'
                          : 'کلیک برای فعال کردن'
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          transaction.isActive
                            ? 'translate-x-1'
                            : 'translate-x-6'
                        }`}
                      />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() =>
                        handleDelete(transaction.id, transaction.title)
                      }
                      className="hover:opacity-70"
                      style={{
                        fontSize: familyTheme.typography.small.size,
                        color: familyTheme.colors.danger
                      }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
