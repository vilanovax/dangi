/**
 * Family Finance Template - Unified Empty State Component
 *
 * کامپوننت یکپارچه برای نمایش حالت خالی
 */

'use client'

import { FamilyIcon, type IconName } from './FamilyIcon'
import { FamilyButton } from './FamilyButton'
import { FamilyCard } from './FamilyCard'

export interface FamilyEmptyStateProps {
  icon: IconName
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'success' | 'danger' | 'warning'
  }
}

/**
 * Empty State یکپارچه
 *
 * @example
 * <FamilyEmptyState
 *   icon="emptyList"
 *   title="هنوز تراکنشی ثبت نشده"
 *   description="با ثبت اولین تراکنش، همه‌چیز شفاف می‌شه"
 *   action={{ label: "ثبت اولین تراکنش", onClick: handleAdd }}
 * />
 */
export function FamilyEmptyState({ icon, title, description, action }: FamilyEmptyStateProps) {
  return (
    <FamilyCard padding="lg" variant="default" className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FamilyIcon name={icon} size={40} className="text-gray-400 dark:text-gray-500" />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
          {description && (
            <p className="text-[13px] text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>

        {/* Action */}
        {action && (
          <FamilyButton
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            size="md"
            className="mt-2"
          >
            {action.label}
          </FamilyButton>
        )}
      </div>
    </FamilyCard>
  )
}
