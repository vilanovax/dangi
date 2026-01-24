'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatMoney } from '@/lib/utils/money'

// ─────────────────────────────────────────────────────────────
// Design Tokens - Centralized color system
// ─────────────────────────────────────────────────────────────

export const HEADER_TOKENS = {
  // Project variant gradients (blue family)
  project: {
    gradient: 'from-sky-400 via-blue-500 to-indigo-500',
    gradientSimple: 'from-blue-500 to-blue-600',
    textPrimary: 'text-white',
    textSecondary: 'text-blue-100',
    textMuted: 'text-blue-200/70',
    cardBg: 'bg-white/15',
    cardBgHover: 'hover:bg-white/20',
    border: 'border-white/20',
  },

  // Action variant tones
  action: {
    success: {
      gradient: 'from-green-500 to-emerald-600',
      textPrimary: 'text-white',
      textSecondary: 'text-green-100',
    },
    danger: {
      gradient: 'from-red-500 to-rose-600',
      textPrimary: 'text-white',
      textSecondary: 'text-red-100',
    },
    warning: {
      gradient: 'from-amber-500 to-orange-600',
      textPrimary: 'text-white',
      textSecondary: 'text-amber-100',
    },
    default: {
      gradient: 'from-blue-500 to-blue-600',
      textPrimary: 'text-white',
      textSecondary: 'text-blue-100',
    },
  },

  // Form variant (minimal)
  form: {
    bg: 'bg-white/95 dark:bg-gray-900/95',
    textPrimary: 'text-gray-800 dark:text-gray-100',
    textSecondary: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-100/50 dark:border-gray-800/50',
  },
} as const

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type HeaderVariant = 'project' | 'action' | 'form'
export type ActionTone = 'default' | 'success' | 'danger' | 'warning'

export interface ProjectMeta {
  membersCount?: number
  expensesCount?: number
  totalAmount?: number
  perPersonShare?: number
  currency?: string
}

export interface UnifiedHeaderProps {
  /** Header variant determines visual style */
  variant: HeaderVariant

  /** Page title */
  title: string
  /** Optional subtitle */
  subtitle?: string

  /** Project metadata - only used with variant="project" */
  projectMeta?: ProjectMeta

  /** Custom content inside header (cards, stats, etc.) */
  children?: ReactNode
  /** Right side action element */
  rightAction?: ReactNode
  /** Left side icon element */
  leftIcon?: ReactNode

  /** Action variant tone - only used with variant="action" */
  tone?: ActionTone

  /** Show back button */
  showBack?: boolean
  /** Back button handler */
  onBack?: () => void

  /** Additional className */
  className?: string
}

// ─────────────────────────────────────────────────────────────
// Back Button Component
// ─────────────────────────────────────────────────────────────

interface BackButtonProps {
  onClick?: () => void
  isLight: boolean
}

function BackButton({ onClick, isLight }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 -mr-2 rounded-xl transition-all active:scale-95',
        isLight
          ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          : 'text-white hover:bg-white/10'
      )}
      aria-label="بازگشت"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Main UnifiedHeader Component
// ─────────────────────────────────────────────────────────────

/**
 * UnifiedHeader - Single header component for all pages
 *
 * Variants:
 * - project: Full gradient with decorations, for dashboard/list pages
 * - action: Colored header for settlements, transfers, end-of-flow
 * - form: Minimal white header for form pages
 *
 * Design Philosophy:
 * - Headers provide context and confidence
 * - Different pages have different intents, but not different rules
 * - Visual consistency across the app
 */
export function UnifiedHeader({
  variant,
  title,
  subtitle,
  projectMeta,
  children,
  rightAction,
  leftIcon,
  tone = 'default',
  showBack = true,
  onBack,
  className,
}: UnifiedHeaderProps) {
  const isProject = variant === 'project'
  const isAction = variant === 'action'
  const isForm = variant === 'form'

  // ── Container styles ──────────────────────────────────────
  const containerStyles = cn('relative', isProject && 'overflow-hidden', className)

  // ── Background styles ─────────────────────────────────────
  const getBackgroundStyles = () => {
    if (isForm) {
      return cn(
        HEADER_TOKENS.form.bg,
        'backdrop-blur-md border-b',
        HEADER_TOKENS.form.border
      )
    }
    if (isAction) {
      return cn('text-white bg-gradient-to-br', HEADER_TOKENS.action[tone].gradient)
    }
    // Project variant - gradient handled by decorative layer for strong effect
    return 'text-white'
  }

  // ── Padding styles ────────────────────────────────────────
  const getPaddingStyles = () => {
    if (isProject) return 'pt-4 pb-8'
    if (isAction) return 'pt-4 pb-5'
    return 'py-3' // form
  }

  // ── Title styles ──────────────────────────────────────────
  const getTitleStyles = () => {
    if (isForm) {
      return cn('text-base font-semibold', HEADER_TOKENS.form.textPrimary)
    }
    if (isAction) {
      return cn('text-lg font-bold', HEADER_TOKENS.action[tone].textPrimary)
    }
    return 'text-2xl font-bold text-white' // project
  }

  // ── Subtitle styles ───────────────────────────────────────
  const getSubtitleStyles = () => {
    if (isForm) {
      return cn('text-xs', HEADER_TOKENS.form.textSecondary)
    }
    if (isAction) {
      return cn('text-sm', HEADER_TOKENS.action[tone].textSecondary)
    }
    return 'text-sm text-blue-100' // project
  }

  // ── Render project meta badge ─────────────────────────────
  const renderProjectMeta = () => {
    if (!projectMeta || !isProject) return null

    return (
      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
        {projectMeta.membersCount && (
          <>
            <span className="text-base">👥</span>
            <span className="text-sm font-medium">{projectMeta.membersCount} هم‌سفر</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={containerStyles}>
      {/* Decorative elements - only for project variant */}
      {isProject && (
        <>
          <div className={cn('absolute inset-0 bg-gradient-to-br', HEADER_TOKENS.project.gradient)} />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-sky-300/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-indigo-300/15 rounded-full blur-xl" />
        </>
      )}

      {/* Main content */}
      <div className={cn(getBackgroundStyles(), 'px-4', getPaddingStyles(), isProject && 'relative')}>
        {/* Navigation row */}
        <div
          className={cn(
            'flex items-center',
            isProject ? 'justify-between mb-5' : 'gap-3',
            !isProject && children ? 'mb-3' : ''
          )}
        >
          {/* Back button */}
          {showBack && <BackButton onClick={onBack} isLight={isForm} />}

          {/* Left icon (optional) */}
          {leftIcon}

          {/* Title section - inline for action/form variants */}
          {!isProject && (
            <div className="flex-1 min-w-0">
              <h1 className={getTitleStyles()}>{title}</h1>
              {subtitle && <p className={getSubtitleStyles()}>{subtitle}</p>}
            </div>
          )}

          {/* Project meta badge (center) */}
          {renderProjectMeta()}

          {/* Right action (optional) */}
          {rightAction}
        </div>

        {/* Title - centered for project variant (separate row) */}
        {isProject && <h1 className={cn(getTitleStyles(), 'text-center mb-4')}>{title}</h1>}

        {/* Children content (cards, stats, etc.) */}
        {children}
      </div>

      {/* Wave bottom - only for project variant */}
      {isProject && (
        <svg
          className="absolute bottom-0 left-0 right-0 text-gray-50 dark:text-gray-950"
          viewBox="0 0 1440 56"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,56 L1440,56 L1440,0 C1200,48 960,56 720,40 C480,24 240,16 0,32 L0,56 Z" />
        </svg>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────

interface HeaderCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  as?: 'div' | 'button'
}

/**
 * Card component for header content (totals, stats, etc.)
 */
export function HeaderCard({ children, className, onClick, as = 'div' }: HeaderCardProps) {
  const Component = as

  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white/15 backdrop-blur-sm rounded-xl p-3',
        onClick && 'hover:bg-white/20 active:scale-[0.99] transition-all cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  )
}

interface HeaderBadgeProps {
  children: ReactNode
  className?: string
}

/**
 * Badge component for header (participant count, etc.)
 */
export function HeaderBadge({ children, className }: HeaderBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5',
        className
      )}
    >
      {children}
    </div>
  )
}

interface HeaderIconButtonProps {
  onClick?: () => void
  ariaLabel: string
  children: ReactNode
  className?: string
}

/**
 * Icon button for header actions (settings, history, etc.)
 */
export function HeaderIconButton({ onClick, ariaLabel, children, className }: HeaderIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-9 h-9 rounded-full bg-white/10 flex items-center justify-center',
        'hover:bg-white/20 active:scale-95 transition-all',
        className
      )}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Prebuilt Header Sections
// ─────────────────────────────────────────────────────────────

interface TotalCardProps {
  label: string
  amount: number
  currency: string
  helperText?: string
  onClick?: () => void
}

/**
 * Pre-built total amount card for project headers
 */
export function HeaderTotalCard({ label, amount, currency, helperText, onClick }: TotalCardProps) {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 w-full text-right',
        onClick && 'hover:bg-white/20 active:scale-[0.99] transition-all cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sky-100 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{formatMoney(amount, currency)}</p>
          {helperText && <p className="text-sky-200/70 text-xs mt-1">{helperText}</p>}
        </div>
        {onClick && (
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

interface SummaryCardProps {
  label: string
  amount: number
  currency: string
  helperText?: string
  isFiltered?: boolean
}

/**
 * Pre-built summary card for list headers (expenses, etc.)
 */
export function HeaderSummaryCard({ label, amount, currency, helperText, isFiltered }: SummaryCardProps) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100/80 text-xs mb-0.5">
            {isFiltered ? 'جمع فیلتر شده' : label}
          </p>
          <p className="text-xl font-semibold tracking-tight">{formatMoney(amount, currency)}</p>
        </div>
        {helperText && <p className="text-blue-200/70 text-[10px]">{helperText}</p>}
      </div>
    </div>
  )
}
