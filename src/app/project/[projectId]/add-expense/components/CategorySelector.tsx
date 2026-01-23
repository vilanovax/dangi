'use client'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface CategorySelectorProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAddNew: () => void
  label: string
  helper: string
}

/**
 * انتخاب دسته‌بندی - Soft chips, completely optional
 *
 * UX Intent:
 * - "بدون دسته" is always a valid choice
 * - Chips feel tappable and friendly
 * - No visual pressure - light borders, gentle colors
 * - Helper text is subtle but visible
 */
export function CategorySelector({
  categories,
  selectedId,
  onSelect,
  onAddNew,
  label,
  helper,
}: CategorySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
        دسته‌بندی
        <span className="text-gray-400 dark:text-gray-500 font-normal mr-1.5 text-xs">(اختیاری)</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {/* گزینه بدون دسته - Always first, always valid */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`px-3.5 py-2 rounded-full text-sm transition-all active:scale-95 ${
            selectedId === null
              ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          بدون دسته
        </button>

        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-3.5 py-2 rounded-full text-sm transition-all flex items-center gap-1.5 active:scale-95 ${
              selectedId === cat.id
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}

        {/* افزودن دسته جدید - Subtle, not prominent */}
        <button
          type="button"
          onClick={onAddNew}
          className="px-3 py-2 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:text-gray-500 dark:hover:border-gray-500 dark:hover:text-gray-400 transition-all flex items-center gap-1 active:scale-95"
        >
          <span className="text-base leading-none">+</span>
        </button>
      </div>

      {/* پیام کمکی - Subtle hint */}
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2.5">
        بعداً هم می‌تونی دسته‌بندی رو عوض کنی
      </p>
    </div>
  )
}
