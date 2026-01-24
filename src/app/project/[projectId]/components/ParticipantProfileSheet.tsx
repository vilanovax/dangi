'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  role: string
  avatar?: string | null
}

interface ParticipantBalance {
  participantId: string
  participantName: string
  totalPaid: number
  totalShare: number
  balance: number
}

interface ExpenseItem {
  id: string
  title: string
  amount: number
  shareAmount: number
  expenseDate: string
  paidById: string
  paidBy: {
    id: string
    name: string
    avatar: string | null
  }
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
  } | null
}

interface ParticipantProfileSheetProps {
  isOpen: boolean
  onClose: () => void
  participant: Participant | null
  balance: ParticipantBalance | null
  currency: string
  settlementCount: number
  projectId: string
  myParticipantId: string | null
  onEdit: () => void
  onDelete: () => void
  onTransferBalance: () => void
}

/**
 * Bottom sheet showing participant profile with balance summary, expenses list, and quick actions
 */
export function ParticipantProfileSheet({
  isOpen,
  onClose,
  participant,
  balance,
  currency,
  settlementCount,
  projectId,
  myParticipantId,
  onEdit,
  onDelete,
  onTransferBalance,
}: ParticipantProfileSheetProps) {
  const router = useRouter()
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)

  // Fetch participant's expenses when sheet opens
  const fetchExpenses = useCallback(async () => {
    if (!participant || !projectId) return

    setLoadingExpenses(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/participants/${participant.id}/expenses`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses || [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoadingExpenses(false)
    }
  }, [participant, projectId])

  useEffect(() => {
    if (isOpen && participant) {
      fetchExpenses()
      setShowAllExpenses(false)
    }
  }, [isOpen, participant, fetchExpenses])

  if (!participant) return null

  const isOwner = participant.role === 'OWNER'
  const balanceAmount = balance?.balance || 0
  const isCreditor = balanceAmount > 0
  const isSettled = Math.abs(balanceAmount) < 1

  // Determine balance color and label
  const getBalanceStyle = () => {
    if (isSettled) {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        label: 'تسویه شده',
        icon: '⚖️',
      }
    }
    if (isCreditor) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        label: 'طلبکار',
        icon: '📈',
      }
    }
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      label: 'بدهکار',
      icon: '📉',
    }
  }

  const balanceStyle = getBalanceStyle()

  // Check if participant can be deleted directly (no activity)
  const hasActivity = (balance?.totalPaid || 0) > 0 || (balance?.totalShare || 0) > 0 || settlementCount > 0
  const canDeleteDirectly = !hasActivity && !isOwner

  // Displayed expenses (limited or all)
  const displayedExpenses = showAllExpenses ? expenses : expenses.slice(0, 3)
  const hasMoreExpenses = expenses.length > 3

  // Format date in Persian
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
      }).format(date)
    } catch {
      return ''
    }
  }

  // Handle expense click - go to edit page
  const handleExpenseClick = (expense: ExpenseItem, canEdit: boolean) => {
    if (canEdit) {
      router.push(`/project/${projectId}/expenses/${expense.id}/edit`)
    } else {
      // Just view the expense details
      router.push(`/project/${projectId}/expenses/${expense.id}`)
    }
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Profile Header */}
        <div className="text-center">
          <div className="relative inline-block">
            {isOwner && (
              <div className="absolute -inset-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-75 blur-sm" />
            )}
            <div className={`relative ${isOwner ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''} rounded-full`}>
              <Avatar
                avatar={deserializeAvatar(participant.avatar || null, participant.name)}
                name={participant.name}
                size="xl"
                className="w-20 h-20"
              />
            </div>
            {isOwner && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold mt-3">{participant.name}</h2>
          {isOwner && (
            <span className="inline-block px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full mt-1">
              مدیر پروژه
            </span>
          )}
        </div>

        {/* Balance Card */}
        <div className={`${balanceStyle.bg} rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">مانده حساب</span>
            <span className="text-lg">{balanceStyle.icon}</span>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${balanceStyle.text}`}>
              {isSettled ? '۰' : (isCreditor ? '+' : '') + formatMoney(Math.abs(balanceAmount), currency)}
            </p>
            <p className={`text-sm ${balanceStyle.text} mt-1`}>{balanceStyle.label}</p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              هزینه‌هایی که سهم داره
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {expenses.length} مورد
            </span>
          </div>

          {loadingExpenses ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">
              هنوز هزینه‌ای ثبت نشده
            </p>
          ) : (
            <div className="space-y-2">
              {displayedExpenses.map((expense) => {
                // Can edit if current user is the one who paid
                const canEdit = myParticipantId === expense.paidById

                return (
                  <button
                    key={expense.id}
                    onClick={() => handleExpenseClick(expense, canEdit)}
                    className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-right"
                  >
                    {/* Category Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: expense.category?.color
                          ? `${expense.category.color}20`
                          : '#f3f4f6',
                      }}
                    >
                      <span className="text-lg">{expense.category?.icon || '💰'}</span>
                    </div>

                    {/* Expense Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {expense.title}
                        </p>
                        {canEdit && (
                          <span className="shrink-0 text-blue-500">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        <span>{formatDate(expense.expenseDate)}</span>
                        <span>•</span>
                        <span>پرداخت: {expense.paidBy.name}</span>
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="text-left shrink-0">
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {formatMoney(expense.amount, currency)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        سهم: {formatMoney(expense.shareAmount, currency)}
                      </p>
                    </div>
                  </button>
                )
              })}

              {/* Show More Button */}
              {hasMoreExpenses && !showAllExpenses && (
                <button
                  onClick={() => setShowAllExpenses(true)}
                  className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                >
                  نمایش همه ({expenses.length} مورد)
                </button>
              )}
              {showAllExpenses && hasMoreExpenses && (
                <button
                  onClick={() => setShowAllExpenses(false)}
                  className="w-full py-2 text-sm text-gray-400 hover:text-gray-500 transition-colors"
                >
                  نمایش کمتر
                </button>
              )}
            </div>
          )}

          {/* Total Share */}
          {expenses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">جمع سهم</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {formatMoney(balance?.totalShare || 0, currency)}
              </span>
            </div>
          )}
        </div>

        {/* Activity Summary - Compact */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">خلاصه فعالیت</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {formatMoney(balance?.totalPaid || 0, currency)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">پرداخت‌ها</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {formatMoney(balance?.totalShare || 0, currency)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">سهم</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {settlementCount}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">تسویه</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="flex-1 flex flex-col items-center gap-1 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-xs font-medium">ویرایش</span>
          </button>

          {/* Transfer Balance Button - Only show if has balance */}
          {!isSettled && (
            <button
              onClick={onTransferBalance}
              className="flex-1 flex flex-col items-center gap-1 py-3 px-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-xs font-medium">انتقال</span>
            </button>
          )}

          {/* Delete Button - Disabled for owner */}
          <button
            onClick={onDelete}
            disabled={isOwner}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-colors ${
              isOwner
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-xs font-medium">{canDeleteDirectly ? 'حذف' : 'حذف'}</span>
          </button>
        </div>

        {/* Owner Warning */}
        {isOwner && (
          <p className="text-xs text-center text-gray-400">
            مدیر پروژه قابل حذف نیست
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
