'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold">تراکنش‌های تکراری</h1>
              <p className="text-purple-100 text-sm">
                {activeCount} فعال · {inactiveCount} غیرفعال
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              router.push(`/project/${projectId}/family/recurring/add`)
            }
            className="bg-white text-purple-600 px-4 py-2 rounded-full font-medium hover:bg-purple-50 transition-colors"
          >
            + افزودن
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="flex gap-2 p-4 max-w-2xl mx-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            همه ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            فعال ({activeCount})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-stone-400 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            غیرفعال ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-stone-600">
            در حال بارگذاری...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <span className="text-6xl mb-4 block">🔄</span>
            <p className="text-stone-600 mb-4">
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
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full"
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
                className={`bg-white rounded-2xl p-4 shadow-md transition-all ${
                  transaction.isActive ? 'opacity-100' : 'opacity-60'
                }`}
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
                      <span className="font-bold text-stone-800">
                        {transaction.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          transaction.type === 'INCOME'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? 'درآمد' : 'هزینه'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-stone-600 mb-2">
                      <div>
                        <span className="font-bold text-stone-800">
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
                      <div className="text-xs text-stone-500">
                        {transaction.category.name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(transaction.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        transaction.isActive ? 'bg-green-500' : 'bg-stone-300'
                      }`}
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
                      className="text-red-500 hover:text-red-700 text-sm"
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
