'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'
import { ExpenseDetailSheet } from '../expenses/components/ExpenseDetailSheet'

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

type Template = 'building' | 'travel' | 'family' | 'gathering'

interface ParticipantProfileSheetProps {
  isOpen: boolean
  onClose: () => void
  participant: Participant | null
  balance: ParticipantBalance | null
  currency: string
  settlementCount: number
  projectId: string
  myParticipantId: string | null
  template?: Template
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
  template = 'building',
  onEdit,
  onDelete,
  onTransferBalance,
}: ParticipantProfileSheetProps) {
  const router = useRouter()
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)

  // Expense detail sheet state
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [showExpenseDetail, setShowExpenseDetail] = useState(false)
  const [loadingExpenseDetail, setLoadingExpenseDetail] = useState(false)

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

  // IMPORTANT: These useCallbacks must be before early returns to maintain hook order
  // Handle edit - navigate to full page
  const handleEditExpense = useCallback(() => {
    if (!selectedExpenseId) return
    setShowExpenseDetail(false)
    router.push(`/project/${projectId}/expense/${selectedExpenseId}`)
  }, [selectedExpenseId, router, projectId])

  // Handle delete expense
  const handleDeleteExpense = useCallback(async () => {
    if (!selectedExpenseId) return

    if (!confirm('آیا از حذف این هزینه اطمینان دارید؟')) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${selectedExpenseId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setShowExpenseDetail(false)
        setSelectedExpense(null)
        setSelectedExpenseId(null)
        // Refresh expenses list
        fetchExpenses()
      } else {
        alert('خطا در حذف هزینه')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('خطا در حذف هزینه')
    }
  }, [selectedExpenseId, projectId, fetchExpenses])

  if (!participant) return null

  const isOwner = participant.role === 'OWNER'
  const balanceAmount = balance?.balance || 0
  const isCreditor = balanceAmount > 0
  const isSettled = Math.abs(balanceAmount) < 1

  // UX: Human-readable balance status with helper text
  const getBalanceStyle = () => {
    if (isSettled) {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        label: 'تسویه شده',
        helper: 'حساب تسویه شده',
        icon: '⚖️',
      }
    }
    if (isCreditor) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        label: 'طلبکار',
        helper: `${participant.name} باید از بقیه بگیره`,
        icon: '📈',
      }
    }
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      label: 'بدهکار',
      helper: `${participant.name} باید پرداخت کنه`,
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

  // Handle expense click - open bottom sheet
  const handleExpenseClick = async (expense: ExpenseItem) => {
    setSelectedExpenseId(expense.id)
    setShowExpenseDetail(true)
    setLoadingExpenseDetail(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedExpense(data.expense)
      }
    } catch (error) {
      console.error('Error fetching expense details:', error)
    } finally {
      setLoadingExpenseDetail(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* UX: Animate entrance for better perceived performance */}
      <div className="space-y-4 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* UX: Profile Header - Reduced spacing, emphasized name */}
        <div className="text-center -mt-2">
          <div className="relative inline-block">
            {/* UX: Owner badge with gradient glow */}
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
          {/* UX: Emphasized participant name - Primary identity */}
          <h2 className="text-2xl font-bold mt-3 mb-1">{participant.name}</h2>
          {isOwner && (
            <span className="inline-block px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
              مدیر پروژه
            </span>
          )}
        </div>

        {/* UX: Balance Card - PRIMARY FOCUS with helper text */}
        <div className={`${balanceStyle.bg} rounded-2xl p-5 shadow-sm border border-transparent animate-in fade-in zoom-in-95 duration-300 delay-100`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">مانده حساب</span>
            <span className="text-2xl">{balanceStyle.icon}</span>
          </div>
          <div className="text-center space-y-2">
            {/* UX: Large balance amount for immediate recognition */}
            <p className={`text-3xl font-bold ${balanceStyle.text}`}>
              {isSettled ? '۰' : (isCreditor ? '+' : '') + formatMoney(Math.abs(balanceAmount), currency)}
            </p>
            <p className={`text-sm font-medium ${balanceStyle.text}`}>{balanceStyle.label}</p>
            {/* UX: Human-readable helper text explaining what this means */}
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {balanceStyle.helper}
            </p>
          </div>
        </div>

        {/* UX: Expenses List - SECONDARY FOCUS, emphasize participant's share */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                const canEdit = myParticipantId === expense.paidById

                return (
                  <button
                    key={expense.id}
                    onClick={() => handleExpenseClick(expense)}
                    className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98] text-right"
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

                    {/* UX: Expense Info - Clear hierarchy */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
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
                      {/* UX: Emphasize participant's share, de-emphasize payer info */}
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        سهم {participant.name}: {formatMoney(expense.shareAmount, currency)}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        <span>{formatDate(expense.expenseDate)}</span>
                        <span>•</span>
                        <span>پرداخت: {expense.paidBy.name}</span>
                      </p>
                    </div>

                    {/* UX: Total amount - de-emphasized, secondary info */}
                    <div className="text-left shrink-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        کل خرج
                      </p>
                      <p className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                        {formatMoney(expense.amount, currency)}
                      </p>
                    </div>
                  </button>
                )
              })}

              {/* UX: Show More Button - Clear, personalized microcopy */}
              {hasMoreExpenses && !showAllExpenses && (
                <button
                  onClick={() => setShowAllExpenses(true)}
                  className="w-full py-2.5 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                >
                  دیدن همه خرج‌های {participant.name} ({expenses.length} مورد)
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

          {/* Total Share Summary */}
          {expenses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">جمع سهم</span>
              <span className="font-bold text-lg text-gray-800 dark:text-gray-200">
                {formatMoney(balance?.totalShare || 0, currency)}
              </span>
            </div>
          )}
        </div>

        {/* UX: Activity Summary - Clear labels for better understanding */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">خلاصه فعالیت</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {formatMoney(balance?.totalPaid || 0, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                پرداخت کرده
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {formatMoney(balance?.totalShare || 0, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                سهمش بوده
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {settlementCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                تسویه
              </p>
            </div>
          </div>
        </div>

        {/* UX: Action Buttons - Clear visual priority, safe-area padding */}
        <div className="flex gap-2.5 pb-2">
          {/* UX: Transfer Balance - PRIMARY action when unsettled */}
          {!isSettled && (
            <button
              onClick={onTransferBalance}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 px-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 active:scale-[0.97] transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-xs font-semibold">انتقال مانده</span>
            </button>
          )}

          {/* UX: Edit Button - Secondary action */}
          <button
            onClick={onEdit}
            className="flex-1 flex flex-col items-center gap-1.5 py-4 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.97] transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-xs font-medium">ویرایش</span>
          </button>

          {/* UX: Delete Button - Destructive, disabled for owner */}
          <button
            onClick={onDelete}
            disabled={isOwner}
            className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-4 rounded-xl transition-all ${
              isOwner
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.97]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-xs font-medium">حذف</span>
          </button>
        </div>

        {/* UX: Owner Warning - Clear explanation */}
        {isOwner && (
          <p className="text-xs text-center text-gray-400 -mt-2 pb-1">
            مدیر پروژه قابل حذف نیست
          </p>
        )}
      </div>

      {/* Expense Detail Sheet */}
      <ExpenseDetailSheet
        isOpen={showExpenseDetail}
        onClose={() => {
          setShowExpenseDetail(false)
          setSelectedExpense(null)
          setSelectedExpenseId(null)
        }}
        expense={selectedExpense}
        projectId={projectId}
        template={template}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />
    </BottomSheet>
  )
}
