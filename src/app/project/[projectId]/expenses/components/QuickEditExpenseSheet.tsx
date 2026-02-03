'use client'

import { useState, useEffect, useRef } from 'react'
import { BottomSheet, Button, Toast } from '@/components/ui'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Participant {
  id: string
  name: string
}

interface Expense {
  id: string
  title: string
  amount: number
  paidById: string
  categoryId?: string | null
  isSettled?: boolean
}

interface QuickEditExpenseSheetProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  categories: Category[]
  participants: Participant[]
  currency: string
  projectId: string
  onSave: (expenseId: string, updates: {
    amount: number
    categoryId: string | null
    paidById: string
    title: string
  }) => Promise<boolean>
}

/**
 * Quick Edit Expense Sheet
 *
 * UX Intent:
 * - Speed over completeness
 * - Fix common mistakes without leaving list
 * - Minimal cognitive load
 * - Auto-focus on amount (most common edit)
 */
export function QuickEditExpenseSheet({
  isOpen,
  onClose,
  expense,
  categories,
  participants,
  currency,
  projectId,
  onSave,
}: QuickEditExpenseSheetProps) {
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [payerId, setPayerId] = useState('')
  const [title, setTitle] = useState('')

  // UI state
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString())
      setCategoryId(expense.categoryId || null)
      setPayerId(expense.paidById)
      setTitle(expense.title)
    }
  }, [expense])

  // Auto-focus amount input when sheet opens
  useEffect(() => {
    if (isOpen && amountInputRef.current) {
      // Small delay to wait for sheet animation
      setTimeout(() => {
        amountInputRef.current?.focus()
        amountInputRef.current?.select()
      }, 300)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!expense) return

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setToast({ message: 'مبلغ معتبر وارد کنید', type: 'error' })
      return
    }

    // Track if payer changed for specific toast
    const payerChanged = payerId !== expense.paidById

    setSaving(true)
    try {
      const success = await onSave(expense.id, {
        amount: amountNum,
        categoryId,
        paidById: payerId,
        title: title.trim() || expense.title,
      })

      if (success) {
        // Show specific toast for payer change, generic for others
        const toastMessage = payerChanged
          ? 'پرداخت‌کننده به‌روزرسانی شد ✓'
          : 'تغییرات ذخیره شد ✓'
        setToast({ message: toastMessage, type: 'success' })
        // Close sheet after short delay
        setTimeout(() => {
          onClose()
        }, 500)
      } else {
        setToast({ message: 'خطا در ذخیره تغییرات', type: 'error' })
      }
    } catch {
      setToast({ message: 'خطا در ذخیره تغییرات', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const isSettled = expense?.isSettled ?? false
  const hasChanges = expense && (
    parseFloat(amount) !== expense.amount ||
    categoryId !== expense.categoryId ||
    payerId !== expense.paidById ||
    title !== expense.title
  )
  const isAmountValid = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="p-5">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              ویرایش سریع خرج
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              فقط موارد اصلی رو اصلاح کن
            </p>
          </div>

          {/* Settled Warning */}
          {isSettled && (
            <div className="mb-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                ⚠️ این خرج قبلاً تسویه شده و قابل ویرایش سریع نیست
              </p>
            </div>
          )}

          {!isSettled && (
            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  مبلغ
                </label>
                <div className="relative">
                  <input
                    ref={amountInputRef}
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="۰"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {currency === 'IRR' ? 'تومان' : currency}
                  </span>
                </div>
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  دسته‌بندی
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        categoryId === cat.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                  {/* "No category" option - last */}
                  <button
                    onClick={() => setCategoryId(null)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      categoryId === null
                        ? 'bg-gray-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    سایر
                  </button>
                </div>
                {/* Hint when no category selected */}
                {categoryId === null && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                    بهتره یک دسته انتخاب کنی
                  </p>
                )}
              </div>

              {/* Payer Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  پرداخت‌کننده
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  توضیحات
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: ناهار، تاکسی..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Full Edit Link */}
              <div className="pt-2">
                <a
                  href={`/project/${projectId}/expense/${expense?.id}?edit=true`}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  ویرایش کامل →
                </a>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  برای تغییر تقسیم هزینه و سایر موارد
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              لغو
            </Button>
            {!isSettled && (
              <Button
                onClick={handleSave}
                className="flex-1"
                loading={saving}
                disabled={saving || !isAmountValid || !hasChanges}
              >
                ذخیره تغییرات
              </Button>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Toast */}
      <Toast
        isOpen={!!toast}
        onClose={() => setToast(null)}
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        duration={2000}
      />
    </>
  )
}
