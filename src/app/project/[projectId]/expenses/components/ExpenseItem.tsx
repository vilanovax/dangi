'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { formatMoney } from '@/lib/utils/money'
import { formatPeriodKeyShort } from '@/lib/utils/persian-date'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface ExpenseItemProps {
  id: string
  projectId: string
  title: string
  amount: number
  currency: string
  payer: {
    id: string
    name: string
  }
  category?: {
    name: string
    icon: string
    color: string
  } | null
  categoryId?: string | null
  periodKey?: string | null
  showPeriod?: boolean
  isHighCost?: boolean
  /** User's share of this expense */
  myShare?: number
  /** Whether user has settled their share (future feature) */
  isSettled?: boolean
  /** Current user's participant ID */
  myParticipantId?: string | null
  onClick?: () => void
  /** Handler for quick edit button */
  onQuickEdit?: () => void
  /** Handler for inline amount update */
  onAmountUpdate?: (expenseId: string, newAmount: number) => Promise<boolean>
  /** Handler for inline category update */
  onCategoryUpdate?: (expenseId: string, newCategoryId: string | null) => Promise<boolean>
  /** Available categories for inline edit */
  categories?: Category[]
  /** Handler for adding new category */
  onAddCategory?: () => void
}

/**
 * Detect if expense is recurring based on category name or title keywords
 */
function isRecurringExpense(title: string, categoryName?: string): boolean {
  const recurringKeywords = ['آب', 'برق', 'گاز', 'اینترنت', 'تلفن', 'اجاره', 'شارژ']
  const text = `${title} ${categoryName || ''}`.toLowerCase()
  return recurringKeywords.some(keyword => text.includes(keyword))
}

/**
 * Detect if expense is a one-time repair based on category name or title keywords
 */
function isRepairExpense(title: string, categoryName?: string): boolean {
  const repairKeywords = ['تعمیر', 'سرویس', 'درست', 'تنظیم', 'نصب', 'لوله', 'شیر']
  const text = `${title} ${categoryName || ''}`.toLowerCase()
  return repairKeywords.some(keyword => text.includes(keyword))
}

/**
 * Single expense item in the timeline - Enhanced with inline edits
 *
 * UX Intent:
 * - Entire card clearly tappable with better feedback
 * - Amount and Category are tap-to-edit for quick corrections
 * - Title more prominent, amount clearly visible
 * - Shows "Your share" to personalize the expense
 * - Status badge shows settlement state (settled/unsettled)
 * - Subtle indicators for high-cost, recurring, and repair expenses
 * - Press feedback using building design tokens
 */
export function ExpenseItem({
  id,
  projectId,
  title,
  amount,
  currency,
  payer,
  category,
  categoryId,
  periodKey,
  showPeriod = false,
  isHighCost = false,
  myShare,
  isSettled = true,
  myParticipantId,
  onClick,
  onQuickEdit,
  onAmountUpdate,
  onCategoryUpdate,
  categories = [],
  onAddCategory,
}: ExpenseItemProps) {
  const isRecurring = isRecurringExpense(title, category?.name)
  const isRepair = isRepairExpense(title, category?.name)

  // Inline amount edit state
  const [isEditingAmount, setIsEditingAmount] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [isSavingAmount, setIsSavingAmount] = useState(false)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const amountContainerRef = useRef<HTMLDivElement>(null)

  // Inline category edit state
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [showSettledMessage, setShowSettledMessage] = useState(false)
  const categoryPopoverRef = useRef<HTMLDivElement>(null)
  const categoryButtonRef = useRef<HTMLButtonElement>(null)

  // Focus input when entering amount edit mode
  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus()
      amountInputRef.current.select()
    }
  }, [isEditingAmount])

  // Handle click outside for amount edit
  useEffect(() => {
    if (!isEditingAmount) return

    const handleClickOutside = (e: MouseEvent) => {
      if (amountContainerRef.current && !amountContainerRef.current.contains(e.target as Node)) {
        handleAmountCancel()
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditingAmount])

  // Handle click outside for category edit
  useEffect(() => {
    if (!isEditingCategory) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryPopoverRef.current &&
        !categoryPopoverRef.current.contains(e.target as Node) &&
        categoryButtonRef.current &&
        !categoryButtonRef.current.contains(e.target as Node)
      ) {
        setIsEditingCategory(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditingCategory(false)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isEditingCategory])

  // Amount edit handlers
  const handleAmountClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onAmountUpdate) return

    setEditValue(amount.toString())
    setAmountError(null)
    setIsEditingAmount(true)
  }, [amount, onAmountUpdate])

  const handleAmountCancel = useCallback(() => {
    setIsEditingAmount(false)
    setEditValue('')
    setAmountError(null)
  }, [])

  const handleAmountSave = useCallback(async () => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      handleAmountCancel()
      return
    }

    const newAmount = parseFloat(trimmed)
    if (isNaN(newAmount) || newAmount <= 0) {
      setAmountError('مبلغ نامعتبر')
      return
    }

    if (newAmount === amount) {
      handleAmountCancel()
      return
    }

    setIsSavingAmount(true)
    try {
      const success = await onAmountUpdate?.(id, newAmount)
      if (success) {
        setIsEditingAmount(false)
        setEditValue('')
        setAmountError(null)
      } else {
        setAmountError('خطا در ذخیره')
      }
    } catch {
      setAmountError('خطا در ذخیره')
    } finally {
      setIsSavingAmount(false)
    }
  }, [editValue, amount, id, onAmountUpdate, handleAmountCancel])

  const handleAmountKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAmountSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleAmountCancel()
    }
  }, [handleAmountSave, handleAmountCancel])

  // Category edit handlers
  const handleCategoryClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onCategoryUpdate) return

    // Note: isSettled check is disabled for now since settlement status isn't computed yet
    // When real settlement tracking is implemented, uncomment this:
    // if (isSettled === true) {
    //   setShowSettledMessage(true)
    //   setTimeout(() => setShowSettledMessage(false), 2500)
    //   return
    // }

    setIsEditingCategory(true)
  }, [onCategoryUpdate])

  const handleCategorySelect = useCallback(async (newCategoryId: string | null) => {
    // Same category - just close
    if (newCategoryId === categoryId) {
      setIsEditingCategory(false)
      return
    }

    setIsSavingCategory(true)
    try {
      const success = await onCategoryUpdate?.(id, newCategoryId)
      if (success) {
        setIsEditingCategory(false)
      }
    } catch {
      // Error handled by parent
    } finally {
      setIsSavingCategory(false)
    }
  }, [id, categoryId, onCategoryUpdate])

  const handleAddCategoryClick = useCallback(() => {
    setIsEditingCategory(false)
    onAddCategory?.()
  }, [onAddCategory])

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  // Check if any inline edit is active
  const isAnyEditActive = isEditingAmount || isEditingCategory

  // Render amount display or input
  const renderAmount = () => {
    if (isEditingAmount) {
      return (
        <div ref={amountContainerRef} className="inline-flex flex-col">
          <div className="inline-flex items-center gap-1">
            <input
              ref={amountInputRef}
              type="number"
              inputMode="numeric"
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value)
                setAmountError(null)
              }}
              onKeyDown={handleAmountKeyDown}
              disabled={isSavingAmount}
              className="font-bold text-lg w-24 px-2 py-0.5 rounded-lg outline-none transition-all"
              style={{
                backgroundColor: amountError ? 'var(--building-danger-alpha)' : 'var(--building-info-alpha)',
                color: 'var(--building-text-primary)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: amountError ? 'var(--building-danger)' : 'var(--building-info)',
              }}
              dir="ltr"
            />
            <span className="text-xs" style={{ color: 'var(--building-text-muted)' }}>
              {currency === 'IRR' ? 'تومان' : currency}
            </span>
            {isSavingAmount && (
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--building-info)', borderTopColor: 'transparent' }}
              />
            )}
          </div>
          {amountError && (
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--building-danger)' }}>
              {amountError}
            </span>
          )}
        </div>
      )
    }

    const canEdit = !!onAmountUpdate
    return (
      <button
        onClick={canEdit ? handleAmountClick : undefined}
        disabled={!canEdit}
        className={`font-bold text-lg inline-flex items-center gap-1 transition-all ${
          canEdit ? 'hover:opacity-80 active:scale-95 cursor-pointer' : 'cursor-default'
        }`}
        style={{ color: 'var(--building-text-primary)' }}
        title={canEdit ? 'برای ویرایش کلیک کنید' : undefined}
      >
        <span className={canEdit ? 'border-b border-dashed border-current/30' : ''}>
          {formatMoney(amount, currency)}
        </span>
        {canEdit && (
          <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )}
      </button>
    )
  }

  // Render category chip with inline edit
  const renderCategory = () => {
    const canEdit = !!onCategoryUpdate && categories.length > 0
    const categoryName = category?.name || 'بدون دسته'
    const categoryIcon = category?.icon || '📝'

    return (
      <div className="relative inline-block">
        <button
          ref={categoryButtonRef}
          onClick={canEdit ? handleCategoryClick : undefined}
          disabled={!canEdit || isSavingCategory}
          className={`inline-flex items-center gap-1 text-xs transition-all ${
            canEdit ? 'hover:opacity-80 active:scale-95 cursor-pointer' : 'cursor-default'
          }`}
          style={{ color: 'var(--building-text-secondary)' }}
          title={canEdit ? 'برای تغییر دسته کلیک کنید' : undefined}
        >
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
              canEdit ? 'border border-dashed border-current/20' : ''
            }`}
          >
            <span>{categoryIcon}</span>
            <span>{categoryName}</span>
            {canEdit && (
              <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </span>
          {isSavingCategory && (
            <div
              className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--building-info)', borderTopColor: 'transparent' }}
            />
          )}
        </button>

        {/* Category Popover */}
        {isEditingCategory && (
          <div
            ref={categoryPopoverRef}
            className="absolute top-full right-0 mt-1 z-50 min-w-[180px] max-h-[240px] overflow-y-auto rounded-xl shadow-lg"
            style={{
              backgroundColor: 'var(--building-surface)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-border)',
            }}
          >
            <div className="py-1">
              {/* No category option */}
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-right transition-colors ${
                  !categoryId ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: !categoryId ? 'var(--building-primary-alpha)' : 'transparent',
                  color: !categoryId ? 'var(--building-primary)' : 'var(--building-text-primary)',
                }}
              >
                <span className="text-base">📝</span>
                <span className="text-sm">بدون دسته</span>
                {!categoryId && (
                  <svg className="w-4 h-4 mr-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Category list */}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-right transition-colors ${
                    categoryId === cat.id ? 'font-medium' : ''
                  }`}
                  style={{
                    backgroundColor: categoryId === cat.id ? 'var(--building-primary-alpha)' : 'transparent',
                    color: categoryId === cat.id ? 'var(--building-primary)' : 'var(--building-text-primary)',
                  }}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-sm">{cat.name}</span>
                  {categoryId === cat.id && (
                    <svg className="w-4 h-4 mr-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Add new category */}
              {onAddCategory && (
                <>
                  <div
                    className="my-1"
                    style={{
                      borderTopWidth: '1px',
                      borderTopStyle: 'solid',
                      borderTopColor: 'var(--building-border-muted)',
                    }}
                  />
                  <button
                    onClick={handleAddCategoryClick}
                    className="w-full flex items-center gap-2 px-3 py-2 text-right transition-colors"
                    style={{ color: 'var(--building-primary)' }}
                  >
                    <span className="text-base">➕</span>
                    <span className="text-sm font-medium">افزودن دسته</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Settled expense message */}
        {showSettledMessage && (
          <div
            className="absolute top-full right-0 mt-1 z-50 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-xs"
            style={{
              backgroundColor: 'var(--building-warning-alpha)',
              color: 'var(--building-warning)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--building-warning-soft)',
            }}
          >
            این خرج تسویه شده و دسته‌اش قابل تغییر نیست
          </div>
        )}
      </div>
    )
  }

  const content = (
    <div
      className="rounded-xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]"
      style={{
        backgroundColor: 'var(--building-surface)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--building-border)',
      }}
      onClick={isAnyEditActive ? undefined : handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon with building tokens */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: category?.color
              ? `${category.color}15`
              : 'var(--building-surface-muted)',
          }}
        >
          <span className="text-xl">{category?.icon || '📝'}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with Indicators - More prominent */}
          <div className="flex items-center gap-1.5 mb-1">
            <h3
              className="font-bold truncate text-base leading-tight"
              style={{ color: 'var(--building-text-primary)' }}
            >
              {title}
            </h3>

            {/* Subtle Indicators */}
            {isHighCost && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                style={{
                  backgroundColor: 'var(--building-warning-alpha)',
                  color: 'var(--building-warning)',
                }}
                title="هزینه بالا"
              >
                💰
              </span>
            )}
            {isRecurring && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                style={{
                  backgroundColor: 'var(--building-info-alpha)',
                  color: 'var(--building-info)',
                }}
                title="هزینه دوره‌ای"
              >
                🔄
              </span>
            )}
            {isRepair && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                style={{
                  backgroundColor: 'var(--building-danger-alpha)',
                  color: 'var(--building-danger)',
                }}
                title="تعمیرات"
              >
                🔧
              </span>
            )}
          </div>

          {/* Amount with Status Badge */}
          <div className="flex items-center gap-2 mb-1.5">
            {renderAmount()}

            {/* Status Badge - Friendly Tone */}
            {myParticipantId && payer.id !== myParticipantId && myShare && myShare > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: isSettled
                    ? 'var(--building-success-alpha)'
                    : 'var(--building-warning-alpha)',
                  color: isSettled ? 'var(--building-success)' : 'var(--building-warning)',
                }}
                title={isSettled ? 'حسابش صافه' : 'هنوز تسویه نشده'}
              >
                {isSettled ? 'تسویه شده' : 'تسویه نشده'}
              </span>
            )}
          </div>

          {/* User Share - Friendly, Conversational */}
          {myShare !== undefined && (
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: myShare > 0 ? 'var(--building-info)' : 'var(--building-text-muted)' }}
            >
              {myShare > 0 ? `سهم شما: ${formatMoney(myShare, currency)}` : 'سهمی نداری'}
            </p>
          )}

          {/* Metadata - Compact and aligned */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--building-text-secondary)' }}>
            <span>{payer.name} پرداخت کرد</span>
            <span style={{ color: 'var(--building-text-muted)' }}>•</span>
            {renderCategory()}
            {showPeriod && periodKey && (
              <>
                <span style={{ color: 'var(--building-text-muted)' }}>•</span>
                <span style={{ color: 'var(--building-info)' }} className="font-medium">
                  {formatPeriodKeyShort(periodKey)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          {/* Quick Edit Button */}
          {onQuickEdit && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onQuickEdit()
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--building-surface-muted)',
                color: 'var(--building-text-secondary)',
              }}
              title="ویرایش سریع"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}

          {/* Chevron indicator */}
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--building-text-muted)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </div>
    </div>
  )

  // If no onClick handler, use Link
  if (!onClick) {
    return (
      <a href={`/project/${projectId}/expense/${id}`} className="block">
        {content}
      </a>
    )
  }

  return content
}
