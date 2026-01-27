'use client'

import { useRouter } from 'next/navigation'

interface QuickActionsCardProps {
  projectId: string
}

export function QuickActionsCard({ projectId }: QuickActionsCardProps) {
  const router = useRouter()

  const actions = [
    {
      icon: '💸',
      label: 'ثبت هزینه',
      color: 'from-red-100 to-red-200',
      textColor: 'text-red-700',
      action: () => router.push(`/project/${projectId}/family/add-expense`),
    },
    {
      icon: '💰',
      label: 'ثبت درآمد',
      color: 'from-green-100 to-green-200',
      textColor: 'text-green-700',
      action: () => router.push(`/project/${projectId}/family/add-income`),
    },
    {
      icon: '🎯',
      label: 'تنظیم بودجه',
      color: 'from-amber-100 to-amber-200',
      textColor: 'text-amber-700',
      action: () => router.push(`/project/${projectId}/family/budgets/set`),
    },
    {
      icon: '📊',
      label: 'گزارش‌ها',
      color: 'from-purple-100 to-purple-200',
      textColor: 'text-purple-700',
      action: () => router.push(`/project/${projectId}/family/reports`),
    },
  ]

  return (
    <div className="h-screen w-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col items-center justify-center p-6 snap-start">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-stone-800 mb-2">
          عملیات سریع
        </h2>
        <p className="text-sm text-stone-600">
          کارهای روزانه خود را انجام دهید
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`bg-gradient-to-br ${action.color} rounded-3xl p-8 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-4 min-h-[160px]`}
          >
            <span className="text-5xl">{action.icon}</span>
            <span className={`text-base font-bold ${action.textColor}`}>
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Navigation hint */}
      <div className="mt-12 text-xs text-stone-400 text-center">
        برای دیدن کارت‌های بعدی به بالا بکشید
      </div>
    </div>
  )
}
