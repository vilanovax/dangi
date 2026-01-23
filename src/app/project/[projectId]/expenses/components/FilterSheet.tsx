'use client'

import { useState } from 'react'
import { BottomSheet, Avatar, Button } from '@/components/ui'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

type FilterType = 'all' | 'category' | 'payer' | 'period' | 'dateRange'

interface Period {
  key: string
  label: string
}

interface DateRange {
  startDate: string | null
  endDate: string | null
}

interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  participants: Participant[]
  filterType: FilterType
  selectedCategoryId: string | null
  selectedPayerId: string | null
  selectedPeriodKey: string | null
  dateRange?: DateRange
  onApplyFilter: (type: FilterType, id: string | null) => void
  onApplyDateRange?: (startDate: string | null, endDate: string | null) => void
  onClearFilters: () => void
  supportsPeriod?: boolean
  availablePeriods?: Period[]
}

/**
 * Filter bottom sheet
 * Simple filters - not advanced, not overwhelming
 */
export function FilterSheet({
  isOpen,
  onClose,
  categories,
  participants,
  filterType,
  selectedCategoryId,
  selectedPayerId,
  selectedPeriodKey,
  dateRange,
  onApplyFilter,
  onApplyDateRange,
  onClearFilters,
  supportsPeriod = false,
  availablePeriods = [],
}: FilterSheetProps) {
  const hasActiveFilter = filterType !== 'all'

  // Local state for date range inputs
  const [localStartDate, setLocalStartDate] = useState(dateRange?.startDate || '')
  const [localEndDate, setLocalEndDate] = useState(dateRange?.endDate || '')

  const handleApplyDateRange = () => {
    if (onApplyDateRange && (localStartDate || localEndDate)) {
      onApplyDateRange(localStartDate || null, localEndDate || null)
    }
  }

  // Quick date range presets
  const handleQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    if (onApplyDateRange) {
      onApplyDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="فیلتر خرج‌ها">
      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            دسته‌بندی
          </h3>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="بدون دسته"
              isActive={filterType === 'category' && selectedCategoryId === 'none'}
              onClick={() => onApplyFilter('category', 'none')}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.name}
                icon={cat.icon}
                isActive={filterType === 'category' && selectedCategoryId === cat.id}
                onClick={() => onApplyFilter('category', cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Payer Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            پرداخت‌کننده
          </h3>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => onApplyFilter('payer', p.id)}
                className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                  filterType === 'payer' && selectedPayerId === p.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-6 h-6">
                  <Avatar
                    avatar={deserializeAvatar(p.avatar || null, p.name)}
                    name={p.name}
                    size="sm"
                  />
                </div>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Period Filter - Only for building template */}
        {supportsPeriod && availablePeriods.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              دوره زمانی
            </h3>
            <div className="flex flex-wrap gap-2">
              {availablePeriods.slice(0, 6).map((period) => (
                <FilterChip
                  key={period.key}
                  label={period.label}
                  isActive={filterType === 'period' && selectedPeriodKey === period.key}
                  onClick={() => onApplyFilter('period', period.key)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            بازه تاریخی
          </h3>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mb-3">
            <FilterChip
              label="هفته اخیر"
              isActive={false}
              onClick={() => handleQuickRange(7)}
            />
            <FilterChip
              label="ماه اخیر"
              isActive={false}
              onClick={() => handleQuickRange(30)}
            />
            <FilterChip
              label="۳ ماه اخیر"
              isActive={false}
              onClick={() => handleQuickRange(90)}
            />
          </div>

          {/* Custom date inputs */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">از تاریخ</label>
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">تا تاریخ</label>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Apply button */}
          {(localStartDate || localEndDate) && (
            <Button
              onClick={handleApplyDateRange}
              size="sm"
              className="w-full mt-3"
            >
              اعمال بازه تاریخی
            </Button>
          )}
        </div>

        {/* Clear Button */}
        {hasActiveFilter && (
          <button
            onClick={onClearFilters}
            className="w-full py-3 text-center text-red-500 text-sm font-medium border-t border-gray-100 dark:border-gray-800 -mx-4 px-4 mt-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            پاک کردن فیلتر
          </button>
        )}
      </div>
    </BottomSheet>
  )
}

// Helper component for filter chips
function FilterChip({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string
  icon?: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 ${
        isActive
          ? 'bg-blue-500 text-white shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  )
}
