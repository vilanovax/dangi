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
import { designTokens as dt } from '@/styles/design-tokens'
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
      <div className={`text-white shadow-lg ${getHeaderGradient('info')}`} style={{ padding: dt.spacing[6] }}>
        <div className="flex items-center justify-between" style={{ marginBottom: dt.spacing[2] }}>
          <div className="flex items-center" style={{ gap: dt.spacing[4] }}>
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full transition-colors"
              style={{ padding: dt.spacing[2] }}
            >
              <FamilyIcon name="back" size={24} className="text-white" />
            </button>
            <div>
              <h1 className="font-bold" style={{ fontSize: dt.typography.sizes.headline }}>
                تراکنش‌های تکراری
              </h1>
              <p className="text-white/90" style={{ fontSize: dt.typography.sizes.body }}>
                {activeCount} فعال · {inactiveCount} غیرفعال
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              router.push(`/project/${projectId}/family/recurring/add`)
            }
            className="bg-white font-medium hover:opacity-90 transition-opacity flex items-center rounded-full"
            style={{
              color: dt.colors.semantic.info,
              padding: `${dt.spacing[2]}px ${dt.spacing[4]}px`,
              fontSize: dt.typography.sizes.body,
              gap: dt.spacing[1],
            }}
          >
            <FamilyIcon name="add" size={16} style={{ color: dt.colors.semantic.info }} />
            افزودن
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div
        className={`border-b sticky top-0 z-10 ${getCardBackgroundClass()}`}
        style={{ borderColor: dt.colors.border.soft }}
      >
        <div className="flex max-w-2xl mx-auto" style={{ gap: dt.spacing[2], padding: dt.spacing[4] }}>
          <button
            onClick={() => setFilter('all')}
            className="rounded-full font-medium transition-colors"
            style={{
              padding: `${dt.spacing[2]}px ${dt.spacing[4]}px`,
              fontSize: dt.typography.sizes.caption,
              backgroundColor: filter === 'all' ? dt.colors.semantic.info : dt.colors.background.app,
              color: filter === 'all' ? 'white' : dt.colors.text.secondary,
            }}
          >
            همه ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className="rounded-full font-medium transition-colors"
            style={{
              padding: `${dt.spacing[2]}px ${dt.spacing[4]}px`,
              fontSize: dt.typography.sizes.caption,
              backgroundColor: filter === 'active' ? dt.colors.semantic.income : dt.colors.background.app,
              color: filter === 'active' ? 'white' : dt.colors.text.secondary,
            }}
          >
            فعال ({activeCount})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className="rounded-full font-medium transition-colors"
            style={{
              padding: `${dt.spacing[2]}px ${dt.spacing[4]}px`,
              fontSize: dt.typography.sizes.caption,
              backgroundColor: filter === 'inactive' ? dt.colors.text.secondary : dt.colors.background.app,
              color: filter === 'inactive' ? 'white' : dt.colors.text.secondary,
            }}
          >
            غیرفعال ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto" style={{ padding: dt.spacing[6] }}>
        {loading ? (
          <div className={`text-center ${getTextColorClass('secondary')}`} style={{ paddingTop: dt.spacing[12], paddingBottom: dt.spacing[12] }}>
            در حال بارگذاری...
          </div>
        ) : error ? (
          <div
            style={{
              padding: `${dt.spacing[3]}px ${dt.spacing[4]}px`,
              borderRadius: dt.radius.lg,
              backgroundColor: dt.colors.semantic.expenseSoft,
              borderWidth: 1,
              borderColor: `${dt.colors.semantic.expense}33`,
              color: dt.colors.semantic.expense,
            }}
          >
            {error}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div
            className={`text-center ${getCardBackgroundClass()}`}
            style={{ borderRadius: dt.radius.xl, padding: dt.spacing[12], boxShadow: dt.shadow.card }}
          >
            <div className="flex justify-center" style={{ marginBottom: dt.spacing[4] }}>
              <FamilyIcon name="recurring" size={64} className={getTextColorClass('secondary')} />
            </div>
            <p className={getTextColorClass('secondary')} style={{ marginBottom: dt.spacing[4], fontSize: dt.typography.sizes.body }}>
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
                className="text-white rounded-full"
                style={{
                  backgroundColor: dt.colors.semantic.info,
                  padding: `${dt.spacing[2]}px ${dt.spacing[6]}px`,
                  fontSize: dt.typography.sizes.body,
                }}
              >
                افزودن اولین تراکنش
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: dt.spacing[3] }}>
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`transition-all ${
                  transaction.isActive ? 'opacity-100' : 'opacity-60'
                } ${getCardBackgroundClass()}`}
                style={{ borderRadius: dt.radius.xl, padding: dt.spacing[4], boxShadow: dt.shadow.card }}
              >
                <div className="flex items-start justify-between" style={{ gap: dt.spacing[4] }}>
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center" style={{ gap: dt.spacing[2], marginBottom: dt.spacing[2] }}>
                      {transaction.category?.icon && (
                        <span style={{ fontSize: dt.typography.sizes.title }}>
                          {transaction.category.icon}
                        </span>
                      )}
                      <span className={`font-bold ${getTextColorClass('primary')}`}>
                        {transaction.title}
                      </span>
                      <span
                        className="rounded-full"
                        style={{
                          padding: `${dt.spacing[0.5]}px ${dt.spacing[2]}px`,
                          fontSize: dt.typography.sizes.caption,
                          backgroundColor: transaction.type === 'INCOME' ? dt.colors.semantic.incomeSoft : dt.colors.semantic.expenseSoft,
                          color: transaction.type === 'INCOME' ? dt.colors.semantic.income : dt.colors.semantic.expense,
                        }}
                      >
                        {transaction.type === 'INCOME' ? 'درآمد' : 'هزینه'}
                      </span>
                    </div>

                    <div
                      className={`flex items-center ${getTextColorClass('secondary')}`}
                      style={{ gap: dt.spacing[4], marginBottom: dt.spacing[2], fontSize: dt.typography.sizes.body }}
                    >
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
                      <div className={getTextColorClass('secondary')} style={{ fontSize: dt.typography.sizes.caption }}>
                        {transaction.category.name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end" style={{ gap: dt.spacing[2] }}>
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(transaction.id)}
                      className="relative inline-flex items-center rounded-full transition-colors"
                      style={{
                        height: 24,
                        width: 44,
                        backgroundColor: transaction.isActive ? dt.colors.semantic.income : dt.colors.border.soft,
                      }}
                      title={
                        transaction.isActive
                          ? 'کلیک برای غیرفعال کردن'
                          : 'کلیک برای فعال کردن'
                      }
                    >
                      <span
                        className={`inline-block transform rounded-full bg-white transition-transform ${
                          transaction.isActive
                            ? 'translate-x-1'
                            : 'translate-x-6'
                        }`}
                        style={{ height: 16, width: 16 }}
                      />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() =>
                        handleDelete(transaction.id, transaction.title)
                      }
                      className={`hover:opacity-70 ${getTextColorClass('danger')}`}
                      style={{ fontSize: dt.typography.sizes.caption }}
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
