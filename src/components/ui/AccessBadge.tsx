'use client'

import type { AccessRole } from '@/types/access-link'

interface AccessBadgeProps {
  type: AccessRole | 'member'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Access Badge Component
 * Shows access level with icon and Persian text
 *
 * Usage:
 * <AccessBadge type="viewer" /> → "👁 مشاهده‌گر"
 * <AccessBadge type="contributor" /> → "✍️ مهمان"
 * <AccessBadge type="admin" /> → "👥 عضویت"
 */
export function AccessBadge({ type, size = 'md', className = '' }: AccessBadgeProps) {
  const variants = {
    viewer: {
      icon: '👁',
      label: 'مشاهده‌گر',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    contributor: {
      icon: '✍️',
      label: 'مهمان',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    admin: {
      icon: '👥',
      label: 'عضویت',
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
    },
    member: {
      icon: '✓',
      label: 'عضو',
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
    },
  }

  const variant = variants[type]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variant.bg} ${variant.text} ${variant.border} ${sizeClasses[size]} ${className}`}
    >
      <span className="flex-shrink-0">{variant.icon}</span>
      <span>{variant.label}</span>
    </span>
  )
}
