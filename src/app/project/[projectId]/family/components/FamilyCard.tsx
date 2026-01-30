/**
 * Family Finance Template - Unified Card Component
 *
 * کامپوننت کارت یکپارچه با subcomponents
 */

'use client'

import { type HTMLAttributes } from 'react'
import { FamilyIcon, type IconName } from './FamilyIcon'
import { familyTheme, getCardBackgroundClass } from '@/styles/family-theme'

export type CardVariant = 'default' | 'highlighted' | 'info' | 'success' | 'danger' | 'warning'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardShadow = 'none' | 'sm' | 'md' | 'lg'

export interface FamilyCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  shadow?: CardShadow
  hoverable?: boolean
  children: React.ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: getCardBackgroundClass(),
  highlighted: 'bg-[#FFF3E0] dark:bg-[#2D1F0D]',
  info: 'bg-[#EEF2FF] dark:bg-[#1E1B3A]',
  success: 'bg-[#EAFBF1] dark:bg-[#0F2417]',
  danger: 'bg-[#FEECEC] dark:bg-[#2D1212]',
  warning: 'bg-[#FEF3C7] dark:bg-[#2D2410]',
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const shadowClasses: Record<CardShadow, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
}

/**
 * کارت یکپارچه تمپلیت مالی
 *
 * @example
 * <FamilyCard variant="default" padding="lg" shadow="md">
 *   <FamilyCard.Header title="عنوان" icon="budget" />
 *   <FamilyCard.Content>محتوا</FamilyCard.Content>
 * </FamilyCard>
 */
export function FamilyCard({
  variant = 'default',
  padding = 'md',
  shadow = 'sm',
  hoverable = false,
  children,
  className = '',
  onClick,
  ...props
}: FamilyCardProps) {
  const baseClasses = `
    rounded-2xl
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${hoverable ? 'hover:shadow-md transition-all duration-200 cursor-pointer' : ''}
    ${className}
  `

  return (
    <div className={baseClasses} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

// Sub-components
interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: IconName
  action?: React.ReactNode
}

FamilyCard.Header = function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0">
            <FamilyIcon name={icon} size={24} className="text-[#FF8A00] dark:text-[#FFA94D]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] text-[#1F2937] dark:text-[#F1F5F9] truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[12px] text-[#6B7280] dark:text-[#CBD5E1] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

FamilyCard.Content = function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

FamilyCard.Footer = function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#334155] ${className}`}>
      {children}
    </div>
  )
}
