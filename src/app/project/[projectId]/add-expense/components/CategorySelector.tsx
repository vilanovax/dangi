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
 * انتخاب دسته‌بندی - کاملاً اختیاری
 * پیام کمکی به وضوح نشان می‌دهد که انتخاب اجباری نیست
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        <span className="text-gray-400 font-normal mr-1">(اختیاری)</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {/* گزینه بدون دسته */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`px-3 py-2 rounded-xl border-2 text-sm transition-all ${
            selectedId === null
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          بدون دسته
        </button>

        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-3 py-2 rounded-xl border-2 text-sm transition-all flex items-center gap-1.5 ${
              selectedId === cat.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}

        {/* افزودن دسته جدید */}
        <button
          type="button"
          onClick={onAddNew}
          className="px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center gap-1"
        >
          <span>+</span>
          <span>افزودن دسته</span>
        </button>
      </div>

      {/* پیام کمکی - باید واضح و قابل رؤیت باشد */}
      <p className="text-xs text-gray-500 mt-2 bg-gray-50 dark:bg-gray-800/30 px-2 py-1 rounded inline-block">
        {helper}
      </p>
    </div>
  )
}
