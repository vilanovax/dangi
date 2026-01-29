/**
 * Quick Actions Card
 * 2x2 grid of large action buttons with flat design
 */

'use client'

import Link from 'next/link'

interface QuickActionsCardProps {
  projectId: string
}

export function QuickActionsCard({ projectId }: QuickActionsCardProps) {
  const actions = [
    {
      icon: '💸',
      label: 'ثبت خرج',
      href: `/project/${projectId}/family/add-expense`,
      color: 'from-red-400 to-rose-500',
    },
    {
      icon: '💰',
      label: 'ثبت درآمد',
      href: `/project/${projectId}/family/add-income`,
      color: 'from-emerald-400 to-green-500',
    },
    {
      icon: '📊',
      label: 'تنظیم بودجه',
      href: `/project/${projectId}/family/budgets/set`,
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: '📈',
      label: 'مشاهده گزارش',
      href: `/project/${projectId}/family/reports`,
      color: 'from-purple-400 to-pink-500',
    },
  ]

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
          کارهای سریع
        </h2>
        <p className="text-amber-700 dark:text-amber-300">
          عملیات روزمره خود را انجام دهید
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Background gradient on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            ></div>

            {/* Content */}
            <div className="relative flex flex-col items-center justify-center gap-4">
              <div className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
                {action.icon}
              </div>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                {action.label}
              </p>
            </div>

            {/* Bottom accent line */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${action.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}
            ></div>
          </Link>
        ))}
      </div>

      {/* Additional action link */}
      <div className="mt-8 text-center">
        <Link
          href={`/project/${projectId}/family/transactions`}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium"
        >
          مشاهده همه تراکنش‌ها →
        </Link>
      </div>
    </div>
  )
}
