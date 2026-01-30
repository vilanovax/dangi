/**
 * Family Finance Template - Unified Button Component
 *
 * کامپوننت دکمه یکپارچه با پشتیبانی از تمام variant ها
 */

'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { FamilyIcon, type IconName } from './FamilyIcon'
import { familyTheme } from '@/styles/family-theme'

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'secondary'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface FamilyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  icon?: IconName
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FF8A00] hover:bg-[#E67A00] dark:bg-[#FFA94D] dark:hover:bg-[#FFB966] text-white',
  success:
    'bg-[#22C55E] hover:bg-[#16A34A] dark:bg-[#4ADE80] dark:hover:bg-[#6EE7A7] text-white',
  danger:
    'bg-[#EF4444] hover:bg-[#DC2626] dark:bg-[#F87171] dark:hover:bg-[#FCA5A5] text-white',
  warning:
    'bg-[#F59E0B] hover:bg-[#D97706] dark:bg-[#FBBF24] dark:hover:bg-[#FCD34D] text-white',
  ghost:
    'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-[#1F2937] dark:text-[#F1F5F9]',
  secondary:
    'bg-white dark:bg-[#1E293B] border-2 border-[#E5E7EB] dark:border-[#334155] hover:border-[#FF8A00] dark:hover:border-[#FFA94D] text-[#1F2937] dark:text-[#F1F5F9]',
}

const sizeClasses: Record<ButtonSize, { height: string; padding: string; fontSize: string }> = {
  sm: { height: 'h-10', padding: 'px-4', fontSize: 'text-sm' },
  md: { height: 'h-[52px]', padding: 'px-6', fontSize: 'text-[15px]' },
  lg: { height: 'h-14', padding: 'px-8', fontSize: 'text-base' },
}

/**
 * دکمه یکپارچه تمپلیت مالی
 *
 * @example
 * <FamilyButton variant="primary" icon="income">
 *   افزودن درآمد
 * </FamilyButton>
 */
export const FamilyButton = forwardRef<HTMLButtonElement, FamilyButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeStyle = sizeClasses[size]

    const baseClasses = `
      ${sizeStyle.height}
      ${sizeStyle.padding}
      ${sizeStyle.fontSize}
      ${fullWidth ? 'w-full' : ''}
      ${variantClasses[variant]}
      rounded-2xl
      font-bold
      transition-all
      duration-200
      active:scale-[0.98]
      disabled:opacity-50
      disabled:cursor-not-allowed
      disabled:active:scale-100
      flex
      items-center
      justify-center
      gap-2
      ${className}
    `

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>در حال پردازش...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <FamilyIcon name={icon} size={18} className="flex-shrink-0" />
            )}
            <span>{children}</span>
            {icon && iconPosition === 'right' && (
              <FamilyIcon name={icon} size={18} className="flex-shrink-0" />
            )}
          </>
        )}
      </button>
    )
  }
)

FamilyButton.displayName = 'FamilyButton'
