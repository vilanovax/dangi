/**
 * Family Finance Template - Unified Header Component
 *
 * کامپوننت header یکپارچه با gradient و dark mode support
 */

'use client'

import { useRouter } from 'next/navigation'
import { FamilyIcon } from './FamilyIcon'
import { getHeaderGradient } from '@/styles/family-theme'

export interface FamilyHeaderProps {
  title: string
  subtitle?: string
  variant?: 'primary' | 'info'
  backButton?: boolean
  onBack?: () => void
  actions?: React.ReactNode
  sticky?: boolean
}

/**
 * Header یکپارچه با gradient برای تمام صفحات
 *
 * @example
 * <FamilyHeader
 *   title="حساب خانواده"
 *   subtitle="مهر ۱۴۰۳"
 *   variant="primary"
 *   backButton
 * />
 */
export function FamilyHeader({
  title,
  subtitle,
  variant = 'primary',
  backButton = false,
  onBack,
  actions,
  sticky = false,
}: FamilyHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div
      className={`
        ${getHeaderGradient(variant)}
        text-white
        p-6
        shadow-lg
        ${sticky ? 'sticky top-0 z-10' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {backButton && (
          <button
            onClick={handleBack}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors flex-shrink-0"
            aria-label="بازگشت"
          >
            <FamilyIcon name="back" size={24} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold truncate">{title}</h1>
          {subtitle && <p className="text-white/90 mt-1 text-sm truncate">{subtitle}</p>}
        </div>

        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
