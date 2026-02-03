'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatMoney } from '@/lib/utils/money'
import type { CategoryBreakdown } from '@/types'

interface CategoryBreakdownCardProps {
  breakdown: CategoryBreakdown[]
  currency: string
  projectId: string
  defaultExpanded?: boolean
}

export function CategoryBreakdownCard({ breakdown, currency, projectId, defaultExpanded = false }: CategoryBreakdownCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (breakdown.length === 0) {
    return null
  }

  const handleCategoryClick = (categoryId: string | null, categoryName: string) => {
    // Navigate to expenses page with category filter
    const params = new URLSearchParams()
    if (categoryId) {
      params.set('category', categoryId)
    } else {
      params.set('category', 'uncategorized')
    }
    params.set('categoryName', categoryName)

    router.push(`/project/${projectId}/expenses?${params.toString()}`)
  }

  // Transform data for pie chart
  const chartData = breakdown.map((cat) => ({
    name: cat.categoryName,
    value: cat.totalAmount,
    color: cat.categoryColor,
    icon: cat.categoryIcon,
    percentage: cat.percentage,
  }))

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{data.payload.icon}</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">{data.name}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatMoney(data.value)} {currency}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {data.payload.percentage.toFixed(1)}% از کل
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <section>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          تفکیک خرج‌ها بر اساس دسته
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {breakdown.length} دسته
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-900/80 rounded-xl border border-gray-100 dark:border-gray-800/50 p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {entry.payload.icon} {value}
                    </span>
                  )}
                  wrapperStyle={{ fontSize: '12px', direction: 'rtl' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900/80 rounded-xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
            {breakdown.map((cat, index) => (
              <button
                key={cat.categoryId || 'uncategorized'}
                onClick={() => handleCategoryClick(cat.categoryId, cat.categoryName)}
                className={`w-full p-3 text-right transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-[0.99] ${
                  index !== breakdown.length - 1 ? 'border-b border-gray-100 dark:border-gray-800/50' : ''
                }`}
              >
                {/* Header: Icon + Name + Amount */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.categoryIcon}</span>
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {cat.categoryName}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {cat.expenseCount} خرج
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {formatMoney(cat.totalAmount)} {currency}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.categoryColor,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
