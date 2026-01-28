'use client'

import { BottomSheet } from '@/components/ui/BottomSheet'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  description?: string
  count?: number
  totalAmount?: number
}

interface TransactionDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  projectId: string
  onDelete: () => void
}

export function TransactionDetailSheet({
  isOpen,
  onClose,
  transaction,
  projectId,
  onDelete,
}: TransactionDetailSheetProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!transaction) return null

  const isIncome = transaction.type === 'INCOME'

  const handleEdit = () => {
    onClose()
    if (isIncome) {
      // Navigate to edit income page (to be created)
      router.push(`/project/${projectId}/family/income/${transaction.id}/edit`)
    } else {
      // Navigate to edit expense page (to be created)
      router.push(`/project/${projectId}/family/expense/${transaction.id}/edit`)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const endpoint = isIncome
        ? `/api/projects/${projectId}/incomes/${transaction.id}`
        : `/api/projects/${projectId}/expenses/${transaction.id}`

      const res = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در حذف')
      }

      // Success - close sheet and refresh
      setShowDeleteConfirm(false)
      onClose()
      onDelete()
    } catch (err) {
      console.error('Error deleting transaction:', err)
      alert(err instanceof Error ? err.message : 'خطا در حذف تراکنش')
    } finally {
      setDeleting(false)
    }
  }

  // Format date to Persian
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  if (showDeleteConfirm) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="py-4 pb-28">
          {/* Warning Icon */}
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse"
            style={{ backgroundColor: familyTheme.colors.dangerSoft }}
          >
            <span className="text-4xl">⚠️</span>
          </div>

          {/* Title */}
          <h3
            className="font-bold text-center mb-3"
            style={{
              fontSize: familyTheme.typography.pageTitle.size,
              fontWeight: familyTheme.typography.pageTitle.weight,
              color: familyTheme.colors.textPrimary
            }}
          >
            حذف تراکنش
          </h3>

          {/* Message */}
          <p
            className="text-center mb-6 px-4 leading-relaxed"
            style={{
              fontSize: familyTheme.typography.body.size,
              color: familyTheme.colors.textSecondary
            }}
          >
            مطمئنی می‌خوای این تراکنش رو حذف کنی؟<br />
            این عمل قابل بازگشت نیست.
          </p>

          {/* Transaction Preview */}
          <div
            className="rounded-xl p-4 mb-6 mx-4 border-2"
            style={{
              backgroundColor: isIncome ? familyTheme.colors.successSoft : familyTheme.colors.dangerSoft,
              borderColor: isIncome ? familyTheme.colors.success + '40' : familyTheme.colors.danger + '40'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isIncome ? familyTheme.colors.success + '40' : familyTheme.colors.danger + '40'
                  }}
                >
                  <span className="text-xl">{transaction.categoryIcon || (isIncome ? '💰' : '💸')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold truncate"
                    style={{ color: familyTheme.colors.textPrimary }}
                  >
                    {transaction.title}
                  </div>
                  {transaction.categoryName && (
                    <div
                      style={{
                        fontSize: familyTheme.typography.small.size,
                        color: familyTheme.colors.textSecondary
                      }}
                    >
                      {transaction.categoryName}
                    </div>
                  )}
                </div>
              </div>
              <div
                className="font-bold flex-shrink-0"
                style={{
                  fontSize: familyTheme.typography.subtitle.size,
                  color: isIncome ? familyTheme.colors.success : familyTheme.colors.danger
                }}
              >
                {isIncome ? '+' : '−'}
                {(transaction.amount / 10).toLocaleString('fa-IR')}
              </div>
            </div>
          </div>

          {/* Actions - با padding کافی */}
          <div
            className="fixed bottom-0 left-0 right-0 border-t p-4 pb-24"
            style={{
              backgroundColor: familyTheme.colors.card,
              borderColor: familyTheme.colors.divider
            }}
          >
            <div className="flex gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-4 rounded-xl font-bold hover:opacity-80 transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: familyTheme.colors.divider,
                  color: familyTheme.colors.textPrimary,
                  fontSize: familyTheme.typography.body.size,
                  boxShadow: familyTheme.card.shadow
                }}
              >
                انصراف
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-4 text-white rounded-xl font-bold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: familyTheme.colors.danger,
                  fontSize: familyTheme.typography.body.size,
                  boxShadow: familyTheme.card.shadow
                }}
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال حذف...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">🗑</span>
                    <span>بله، حذف کن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>
    )
  }

  const displayAmount = transaction.totalAmount || transaction.amount
  const isAggregated = transaction.count && transaction.count > 1

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="py-2 pb-24">
        {/* Hero Section - Amount */}
        <div
          className="rounded-2xl p-6 text-center mb-5"
          style={{
            backgroundColor: isIncome ? familyTheme.colors.successSoft : familyTheme.colors.dangerSoft
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isIncome ? familyTheme.colors.success + '40' : familyTheme.colors.danger + '40'
            }}
          >
            <span className="text-3xl">{transaction.categoryIcon || (isIncome ? '💰' : '💸')}</span>
          </div>
          {isAggregated && (
            <div className="mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-white/80"
                style={{ fontSize: familyTheme.typography.small.size }}
              >
                <span>🔄</span>
                <span>{transaction.count} مورد تکراری</span>
              </span>
            </div>
          )}
          <div
            className="font-bold mb-1"
            style={{
              fontSize: '36px',
              fontWeight: familyTheme.typography.heroNumber.weight,
              color: isIncome ? familyTheme.colors.success : familyTheme.colors.danger
            }}
          >
            {isIncome ? '+' : '−'}
            {(displayAmount / 10).toLocaleString('fa-IR')}
          </div>
          <div
            style={{
              fontSize: familyTheme.typography.body.size,
              color: familyTheme.colors.textSecondary
            }}
          >
            {isAggregated ? 'جمع کل' : 'تومان'}
          </div>
          {isAggregated && (
            <div
              className="mt-1"
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              هر مورد: {(transaction.amount / 10).toLocaleString('fa-IR')} تومان
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-4 px-2">
          {/* Title */}
          <div>
            <div
              className="mb-1"
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              عنوان
            </div>
            <div
              className="font-semibold"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textPrimary
              }}
            >
              {transaction.title}
            </div>
          </div>

          {/* Category */}
          {transaction.categoryName && (
            <div>
              <div
                className="mb-1"
                style={{
                  fontSize: familyTheme.typography.small.size,
                  color: familyTheme.colors.textSecondary
                }}
              >
                دسته‌بندی
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{transaction.categoryIcon}</span>
                <span
                  style={{
                    fontSize: familyTheme.typography.body.size,
                    color: familyTheme.colors.textPrimary
                  }}
                >
                  {transaction.categoryName}
                </span>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <div
              className="mb-1"
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              تاریخ
            </div>
            <div
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textPrimary
              }}
            >
              {formatDate(transaction.date)}
            </div>
          </div>

          {/* Person */}
          <div>
            <div
              className="mb-1"
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              {isIncome ? 'دریافت‌کننده' : 'پرداخت‌کننده'}
            </div>
            <div
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textPrimary
              }}
            >
              {transaction.personName}
            </div>
          </div>

          {/* Type Badge */}
          <div>
            <div
              className="mb-1"
              style={{
                fontSize: familyTheme.typography.small.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              نوع
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium"
              style={{
                fontSize: familyTheme.typography.body.size,
                backgroundColor: isIncome ? familyTheme.colors.successSoft : familyTheme.colors.dangerSoft,
                color: isIncome ? familyTheme.colors.success : familyTheme.colors.danger
              }}
            >
              <span>{isIncome ? '💰' : '💸'}</span>
              <span>{isIncome ? 'درآمد' : 'هزینه'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - با فاصله کافی از bottom navigation */}
        <div
          className="fixed bottom-0 left-0 right-0 border-t p-4 pb-24"
          style={{
            backgroundColor: familyTheme.colors.card,
            borderColor: familyTheme.colors.divider
          }}
        >
          <div className="flex gap-3 max-w-2xl mx-auto">
            <button
              onClick={handleEdit}
              className="flex-1 py-4 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: familyTheme.colors.primary,
                fontSize: familyTheme.typography.body.size,
                boxShadow: familyTheme.card.shadow
              }}
            >
              <span className="text-xl">✏️</span>
              <span>ویرایش</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-4 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: familyTheme.colors.danger,
                fontSize: familyTheme.typography.body.size,
                boxShadow: familyTheme.card.shadow
              }}
            >
              <span className="text-xl">🗑</span>
              <span>حذف</span>
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
