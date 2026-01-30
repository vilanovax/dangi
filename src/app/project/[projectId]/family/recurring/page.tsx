'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import {
  getBackgroundClass,
  getHeaderGradient,
  getCardBackgroundClass,
  getTextColorClass,
} from '@/styles/family-theme'
import { FamilyIcon } from '../components/FamilyIcon'
import { FamilyButton } from '../components/FamilyButton'

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
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Header */}
      <div className={`text-white p-6 shadow-lg ${getHeaderGradient('info')}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <FamilyIcon name="back" size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-[22px] font-bold">
                تراکنش‌های تکراری
              </h1>
              <p className="text-white/90 text-[14px]">
                {activeCount} فعال · {inactiveCount} غیرفعال
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              router.push(`/project/${projectId}/family/recurring/add`)
            }
            className="bg-white text-[#4F6EF7] dark:text-[#818CF8] px-4 py-2 rounded-full font-medium hover:opacity-90 transition-opacity text-[14px] flex items-center gap-1"
          >
            <FamilyIcon name="add" size={16} className="text-[#4F6EF7] dark:text-[#818CF8]" />
            افزودن
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={`border-b sticky top-0 z-10 border-[#E5E7EB] dark:border-[#334155] ${getCardBackgroundClass()}`}>
        <div className="flex gap-2 p-4 max-w-2xl mx-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition-colors text-[12px] ${
              filter === 'all'
                ? 'bg-[#4F6EF7] dark:bg-[#818CF8] text-white'
                : 'bg-[#FFFDF8] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#CBD5E1]'
            }`}
          >
            همه ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-full font-medium transition-colors text-[12px] ${
              filter === 'active'
                ? 'bg-[#22C55E] dark:bg-[#4ADE80] text-white'
                : 'bg-[#FFFDF8] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#CBD5E1]'
            }`}
          >
            فعال ({activeCount})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-full font-medium transition-colors text-[12px] ${
              filter === 'inactive'
                ? 'bg-[#6B7280] dark:bg-[#CBD5E1] text-white'
                : 'bg-[#FFFDF8] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#CBD5E1]'
            }`}
          >
            غیرفعال ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className={`text-center py-12 ${getTextColorClass('secondary')}`}>
            در حال بارگذاری...
          </div>
        ) : error ? (
          <div className="px-4 py-3 rounded-xl bg-[#FEECEC] dark:bg-[#2D1212] border border-[#EF4444]/20 dark:border-[#F87171]/20 text-[#EF4444] dark:text-[#F87171]">
            {error}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center shadow-sm ${getCardBackgroundClass()}`}>
            <div className="mb-4 flex justify-center">
              <FamilyIcon name="recurring" size={64} className={getTextColorClass('secondary')} />
            </div>
            <p className={`mb-4 text-[14px] ${getTextColorClass('secondary')}`}>
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
                className="bg-[#4F6EF7] dark:bg-[#818CF8] text-white px-6 py-2 rounded-full text-[14px]"
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
                className={`rounded-2xl p-4 shadow-sm transition-all ${
                  transaction.isActive ? 'opacity-100' : 'opacity-60'
                } ${getCardBackgroundClass()}`}
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
                      <span className={`font-bold ${getTextColorClass('primary')}`}>
                        {transaction.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[12px] ${
                        transaction.type === 'INCOME'
                          ? 'bg-[#EAFBF1] dark:bg-[#0F2417] text-[#22C55E] dark:text-[#4ADE80]'
                          : 'bg-[#FEECEC] dark:bg-[#2D1212] text-[#EF4444] dark:text-[#F87171]'
                      }`}>
                        {transaction.type === 'INCOME' ? 'درآمد' : 'هزینه'}
                      </span>
                    </div>

                    <div className={`flex items-center gap-4 mb-2 text-[14px] ${getTextColorClass('secondary')}`}>
                      <div>
                        <span className={`font-bold ${getTextColorClass('primary')}`}>
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
                      <div className={`text-[12px] ${getTextColorClass('secondary')}`}>
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
                        transaction.isActive
                          ? 'bg-[#22C55E] dark:bg-[#4ADE80]'
                          : 'bg-[#E5E7EB] dark:bg-[#334155]'
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
                      className={`hover:opacity-70 text-[12px] ${getTextColorClass('danger')}`}
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
