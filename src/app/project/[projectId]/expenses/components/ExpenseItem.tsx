'use client'

import { formatMoney } from '@/lib/utils/money'
import { formatPeriodKeyShort } from '@/lib/utils/persian-date'

interface ExpenseItemProps {
  id: string
  projectId: string
  title: string
  amount: number
  currency: string
  payer: {
    name: string
  }
  category?: {
    name: string
    icon: string
    color: string
  } | null
  periodKey?: string | null
  showPeriod?: boolean
  isHighCost?: boolean
  onClick?: () => void
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
 * Single expense item in the timeline - Final Polish
 *
 * UX Intent:
 * - Entire card clearly tappable with better feedback
 * - Title more prominent, amount clearly visible
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
  periodKey,
  showPeriod = false,
  isHighCost = false,
  onClick,
}: ExpenseItemProps) {
  const isRecurring = isRecurringExpense(title, category?.name)
  const isRepair = isRepairExpense(title, category?.name)

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
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
      onClick={handleClick}
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

          {/* Amount - Clear and prominent */}
          <p
            className="font-bold text-lg mb-1.5"
            style={{ color: 'var(--building-text-primary)' }}
          >
            {formatMoney(amount, currency)}
          </p>

          {/* Metadata - Compact and aligned */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--building-text-secondary)' }}>
            <span>{payer.name}</span>
            {category && (
              <>
                <span style={{ color: 'var(--building-text-muted)' }}>•</span>
                <span>{category.name}</span>
              </>
            )}
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

        {/* Chevron indicator */}
        <svg
          className="w-5 h-5 flex-shrink-0 mt-1"
          style={{ color: 'var(--building-text-muted)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
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
