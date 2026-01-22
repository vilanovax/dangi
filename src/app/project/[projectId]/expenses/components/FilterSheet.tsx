'use client'

import { BottomSheet, Avatar } from '@/components/ui'
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

type FilterType = 'all' | 'category' | 'payer' | 'period'

interface Period {
  key: string
  label: string
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
  onApplyFilter: (type: FilterType, id: string | null) => void
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
  onApplyFilter,
  onClearFilters,
  supportsPeriod = false,
  availablePeriods = [],
}: FilterSheetProps) {
  const hasActiveFilter = filterType !== 'all'

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
