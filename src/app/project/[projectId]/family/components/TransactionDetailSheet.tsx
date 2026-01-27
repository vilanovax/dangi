'use client'

import { BottomSheet } from '@/components/ui/BottomSheet'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const bgColor = isIncome ? 'bg-green-50' : 'bg-red-50'
  const textColor = isIncome ? 'text-green-700' : 'text-red-700'
  const iconBgColor = isIncome ? 'bg-green-100' : 'bg-red-100'

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
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
            <span className="text-4xl">⚠️</span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-center text-stone-800 mb-3">
            حذف تراکنش
          </h3>

          {/* Message */}
          <p className="text-center text-stone-600 mb-6 px-4 text-base leading-relaxed">
            مطمئنی می‌خوای این تراکنش رو حذف کنی؟<br />
            این عمل قابل بازگشت نیست.
          </p>

          {/* Transaction Preview */}
          <div className={`${bgColor} rounded-xl p-4 mb-6 mx-4 border-2 ${isIncome ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl">{transaction.categoryIcon || (isIncome ? '💰' : '💸')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-stone-800 truncate">{transaction.title}</div>
                  {transaction.categoryName && (
                    <div className="text-xs text-stone-600">{transaction.categoryName}</div>
                  )}
                </div>
              </div>
              <div className={`font-bold ${textColor} text-lg flex-shrink-0`}>
                {isIncome ? '+' : '−'}
                {(transaction.amount / 10).toLocaleString('fa-IR')}
              </div>
            </div>
          </div>

          {/* Actions - با padding کافی */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 pb-24">
            <div className="flex gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-4 bg-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-300 transition-colors disabled:opacity-50 shadow-lg text-base"
              >
                انصراف
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg text-base"
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
        <div className={`${bgColor} rounded-2xl p-6 text-center mb-5`}>
          <div className={`w-16 h-16 mx-auto mb-3 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <span className="text-3xl">{transaction.categoryIcon || (isIncome ? '💰' : '💸')}</span>
          </div>
          {isAggregated && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/80">
                <span>🔄</span>
                <span>{transaction.count} مورد تکراری</span>
              </span>
            </div>
          )}
          <div className={`text-4xl font-bold ${textColor} mb-1`}>
            {isIncome ? '+' : '−'}
            {(displayAmount / 10).toLocaleString('fa-IR')}
          </div>
          <div className="text-sm text-stone-600">
            {isAggregated ? 'جمع کل' : 'تومان'}
          </div>
          {isAggregated && (
            <div className="text-xs text-stone-500 mt-1">
              هر مورد: {(transaction.amount / 10).toLocaleString('fa-IR')} تومان
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-4 px-2">
          {/* Title */}
          <div>
            <div className="text-xs text-stone-500 mb-1">عنوان</div>
            <div className="text-base font-semibold text-stone-800">{transaction.title}</div>
          </div>

          {/* Category */}
          {transaction.categoryName && (
            <div>
              <div className="text-xs text-stone-500 mb-1">دسته‌بندی</div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{transaction.categoryIcon}</span>
                <span className="text-base text-stone-800">{transaction.categoryName}</span>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <div className="text-xs text-stone-500 mb-1">تاریخ</div>
            <div className="text-base text-stone-800">{formatDate(transaction.date)}</div>
          </div>

          {/* Person */}
          <div>
            <div className="text-xs text-stone-500 mb-1">
              {isIncome ? 'دریافت‌کننده' : 'پرداخت‌کننده'}
            </div>
            <div className="text-base text-stone-800">{transaction.personName}</div>
          </div>

          {/* Type Badge */}
          <div>
            <div className="text-xs text-stone-500 mb-1">نوع</div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: isIncome ? '#D1FAE5' : '#FEE2E2',
                color: isIncome ? '#065F46' : '#991B1B'
              }}
            >
              <span>{isIncome ? '💰' : '💸'}</span>
              <span>{isIncome ? 'درآمد' : 'هزینه'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - با فاصله کافی از bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 pb-24">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <button
              onClick={handleEdit}
              className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-2 text-base"
            >
              <span className="text-xl">✏️</span>
              <span>ویرایش</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-rose-600 transition-all shadow-lg flex items-center justify-center gap-2 text-base"
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
