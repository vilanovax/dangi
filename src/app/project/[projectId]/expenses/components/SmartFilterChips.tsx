'use client'

import { useMemo } from 'react'
import {
  calculateTopSpendingCategories,
  calculateHeavyExpenseThreshold,
  countHeavyExpenses,
  type Expense as AnalyticsExpense,
  type Category as AnalyticsCategory,
} from '@/lib/utils/expense-analytics'

export type SmartFilter = 'all' | 'heavy' | 'unsettled' | string // string for category IDs

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  amount: number
  categoryId?: string
}

interface SmartFilterChipsProps {
  expenses: Expense[]
  categories: Category[]
  activeFilter: SmartFilter
  onFilterChange: (filter: SmartFilter) => void
}

/**
 * Smart Filter Chips - Quick expense filtering WITHOUT analytics overhead
 *
 * UX Intent:
 * - Lightweight, scrollable chips for quick insights
 * - NOT an analytics dashboard - just helpful shortcuts
 * - Shows dynamically computed top categories
 * - Heavy expenses = top 20% by amount
 * - Unsettled = expenses awaiting settlement (future feature)
 * - Max 4-5 chips to avoid clutter
 */
export function SmartFilterChips({
  expenses,
  categories,
  activeFilter,
  onFilterChange,
}: SmartFilterChipsProps) {
  // Compute top spending categories (max 2) - using analytics utility
  const topCategoryResults = useMemo(() => {
    return calculateTopSpendingCategories(
      expenses as AnalyticsExpense[],
      categories as AnalyticsCategory[]
    )
  }, [expenses, categories])

  const topCategories = useMemo(() => {
    return topCategoryResults.map((result) => ({
      id: result.categoryId,
      name: result.categoryName,
      icon: result.categoryIcon || '',
      color: result.categoryColor || '',
    }))
  }, [topCategoryResults])

  // Compute heavy expense count (top 20%) - using analytics utility
  const heavyCount = useMemo(() => {
    return countHeavyExpenses(expenses as AnalyticsExpense[])
  }, [expenses])

  return (
    <div
      className="px-4 py-3"
      style={{
        backgroundColor: 'var(--building-surface)',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--building-border-muted)',
      }}
    >
      {/* Scrollable chip row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {/* All */}
        <Chip
          label="همه"
          count={expenses.length}
          isActive={activeFilter === 'all'}
          onClick={() => onFilterChange('all')}
          variant="neutral"
        />

        {/* Heavy Expenses */}
        {heavyCount > 0 && (
          <Chip
            label="خرج‌های سنگین"
            count={heavyCount}
            isActive={activeFilter === 'heavy'}
            onClick={() => onFilterChange('heavy')}
            variant="warning"
            icon="💰"
          />
        )}

        {/* Top Categories */}
        {topCategories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            icon={category.icon}
            isActive={activeFilter === category.id}
            onClick={() => onFilterChange(category.id)}
            variant="category"
            color={category.color}
          />
        ))}

        {/* Unsettled - Future feature placeholder */}
        {/* <Chip
          label="تسویه‌نشده"
          count={0}
          isActive={activeFilter === 'unsettled'}
          onClick={() => onFilterChange('unsettled')}
          variant="danger"
          icon="⏳"
        /> */}
      </div>
    </div>
  )
}

// ============================================
// Chip Component
// ============================================

interface ChipProps {
  label: string
  count?: number
  icon?: string
  isActive: boolean
  onClick: () => void
  variant: 'neutral' | 'warning' | 'danger' | 'category'
  color?: string // For category variant
}

function Chip({ label, count, icon, isActive, onClick, variant, color }: ChipProps) {
  const getChipStyles = () => {
    if (isActive) {
      // Active state - uses primary color
      return {
        backgroundColor: 'var(--building-primary)',
        color: '#ffffff',
        borderColor: 'var(--building-primary)',
      }
    }

    // Inactive state - variant-specific
    switch (variant) {
      case 'warning':
        return {
          backgroundColor: 'var(--building-warning-alpha)',
          color: 'var(--building-warning)',
          borderColor: 'var(--building-warning-soft)',
        }
      case 'danger':
        return {
          backgroundColor: 'var(--building-danger-alpha)',
          color: 'var(--building-danger)',
          borderColor: 'var(--building-danger-soft)',
        }
      case 'category':
        return {
          backgroundColor: color ? `${color}10` : 'var(--building-surface-muted)',
          color: color || 'var(--building-text-primary)',
          borderColor: color ? `${color}30` : 'var(--building-border)',
        }
      default:
        return {
          backgroundColor: 'var(--building-surface-muted)',
          color: 'var(--building-text-secondary)',
          borderColor: 'var(--building-border)',
        }
    }
  }

  const styles = getChipStyles()

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all active:scale-95 whitespace-nowrap"
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: styles.borderColor,
      }}
    >
      {icon && <span className="text-sm">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
