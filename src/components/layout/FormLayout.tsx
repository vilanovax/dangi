'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────────────────────────
// Spacing Tokens - Consistent vertical rhythm
// ─────────────────────────────────────────────────────────────

export const FORM_SPACING = {
  /** Gap between major sections */
  sectionGap: 'space-y-6',
  /** Gap between form fields */
  fieldGap: 'space-y-5',
  /** Padding for content area */
  contentPadding: 'px-4 py-5',
  /** Bottom safe area for fixed CTA */
  footerSafeArea: 'pb-32',
} as const

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface FormLayoutProps {
  /** Header component - typically UnifiedHeader with variant="form" or variant="action" */
  header: ReactNode

  /** Optional context badge - shows current project/context info */
  context?: ReactNode

  /** Hero section - the most important input (amount, name, etc.) */
  hero?: ReactNode

  /** Secondary form fields - passed as children */
  children?: ReactNode

  /** Footer CTA - typically a submit button */
  footer: ReactNode

  /** Additional className for the main container */
  className?: string

  /** Whether the footer should be sticky (default: true) */
  stickyFooter?: boolean
}

// ─────────────────────────────────────────────────────────────
// Main FormLayout Component
// ─────────────────────────────────────────────────────────────

/**
 * FormLayout - Unified layout component for all forms
 *
 * Provides:
 * - Consistent structure across all forms
 * - Predictable UX with clear sections
 * - Reduced cognitive load
 * - Mobile-first with safe-area support
 *
 * Layout Structure:
 * ┌─────────────────────────────────┐
 * │         Header                  │ ← Fixed/Sticky
 * ├─────────────────────────────────┤
 * │         Context (optional)      │
 * ├─────────────────────────────────┤
 * │         Hero Section            │ ← Visually prominent
 * ├─────────────────────────────────┤
 * │         Divider                 │
 * ├─────────────────────────────────┤
 * │         Secondary Fields        │ ← Scrollable
 * │         (children)              │
 * ├─────────────────────────────────┤
 * │         Footer CTA              │ ← Fixed/Sticky
 * └─────────────────────────────────┘
 *
 * Design Philosophy:
 * - User must instantly know where they are
 * - User must instantly know what is required
 * - User must instantly know how to finish
 */
export function FormLayout({
  header,
  context,
  hero,
  children,
  footer,
  className,
  stickyFooter = true,
}: FormLayoutProps) {
  return (
    <main className={cn('min-h-dvh bg-gray-50 dark:bg-gray-950', className)}>
      {/* Header - Sticky at top */}
      <div className="sticky top-0 z-10">{header}</div>

      {/* Scrollable content area */}
      <div className={cn(FORM_SPACING.contentPadding, stickyFooter && FORM_SPACING.footerSafeArea)}>
        {/* Context badge - optional project/state info */}
        {context && <div className="mb-4">{context}</div>}

        {/* Hero section - the most important input */}
        {hero && <div className="mb-6">{hero}</div>}

        {/* Divider between hero and secondary fields */}
        {hero && children && (
          <div className="border-t border-gray-200/50 dark:border-gray-800/50 mb-6" />
        )}

        {/* Secondary fields */}
        {children && <div className={FORM_SPACING.fieldGap}>{children}</div>}
      </div>

      {/* Footer CTA */}
      {stickyFooter ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 safe-bottom">
          {footer}
        </div>
      ) : (
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          {footer}
        </div>
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────

interface FormSectionProps {
  /** Section title */
  title?: string
  /** Optional helper text */
  helper?: string
  /** Whether the section is optional */
  optional?: boolean
  /** Section content */
  children: ReactNode
  /** Additional className */
  className?: string
}

/**
 * FormSection - Groups related form fields with optional title
 */
export function FormSection({ title, helper, optional, children, className }: FormSectionProps) {
  return (
    <div className={className}>
      {title && (
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {title}
          {optional && (
            <span className="text-gray-400 font-normal mr-1.5 text-xs">(اختیاری)</span>
          )}
        </label>
      )}
      {helper && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{helper}</p>
      )}
      {children}
    </div>
  )
}

interface FormDividerProps {
  /** Optional divider text */
  text?: string
  /** Additional className */
  className?: string
}

/**
 * FormDivider - Visual separator between form sections
 */
export function FormDivider({ text, className }: FormDividerProps) {
  if (text) {
    return (
      <div className={cn('flex items-center gap-3 my-6', className)}>
        <div className="flex-1 border-t border-gray-200/50 dark:border-gray-800/50" />
        <span className="text-xs text-gray-400 dark:text-gray-500">{text}</span>
        <div className="flex-1 border-t border-gray-200/50 dark:border-gray-800/50" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-t border-gray-200/50 dark:border-gray-800/50 my-6',
        className
      )}
    />
  )
}

interface FormContextBadgeProps {
  /** Icon to display */
  icon: string
  /** Badge text */
  text: string
  /** Additional className */
  className?: string
}

/**
 * FormContextBadge - Shows current context (project name, etc.)
 */
export function FormContextBadge({ icon, text, className }: FormContextBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full',
        className
      )}
    >
      <span className="text-sm">{icon}</span>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  )
}

interface FormErrorProps {
  /** Error message */
  message: string
  /** Additional className */
  className?: string
}

/**
 * FormError - Displays error message
 */
export function FormError({ message, className }: FormErrorProps) {
  return (
    <div
      className={cn(
        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm',
        className
      )}
    >
      {message}
    </div>
  )
}

interface FormSuccessProps {
  /** Success message */
  message: string
  /** Additional className */
  className?: string
}

/**
 * FormSuccess - Displays success message
 */
export function FormSuccess({ message, className }: FormSuccessProps) {
  return (
    <div
      className={cn(
        'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm',
        className
      )}
    >
      {message}
    </div>
  )
}
