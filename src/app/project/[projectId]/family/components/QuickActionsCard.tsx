'use client'

import { useRouter } from 'next/navigation'
import { familyTheme } from '@/styles/family-theme'

interface QuickActionsCardProps {
  projectId: string
}

export function QuickActionsCard({ projectId }: QuickActionsCardProps) {
  const router = useRouter()

  const actions = [
    {
      icon: '💸',
      label: 'ثبت هزینه',
      bgColor: familyTheme.colors.dangerSoft,
      textColor: familyTheme.colors.danger,
      action: () => router.push(`/project/${projectId}/family/add-expense`),
    },
    {
      icon: '💰',
      label: 'ثبت درآمد',
      bgColor: familyTheme.colors.successSoft,
      textColor: familyTheme.colors.success,
      action: () => router.push(`/project/${projectId}/family/add-income`),
    },
    {
      icon: '🎯',
      label: 'تنظیم بودجه',
      bgColor: familyTheme.colors.primarySoft,
      textColor: familyTheme.colors.primary,
      action: () => router.push(`/project/${projectId}/family/budgets/set`),
    },
    {
      icon: '📊',
      label: 'گزارش‌ها',
      bgColor: familyTheme.colors.infoSoft,
      textColor: familyTheme.colors.info,
      action: () => router.push(`/project/${projectId}/family/reports`),
    },
  ]

  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center p-6 snap-start"
      style={{ backgroundColor: familyTheme.colors.background }}
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h2
          className="font-bold mb-2"
          style={{
            fontSize: '28px',
            fontWeight: familyTheme.typography.pageTitle.weight,
            color: familyTheme.colors.textPrimary
          }}
        >
          عملیات سریع
        </h2>
        <p
          style={{
            fontSize: familyTheme.typography.body.size,
            color: familyTheme.colors.textSecondary
          }}
        >
          کارهای روزانه خود را انجام دهید
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="rounded-3xl p-8 hover:shadow-xl active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-4 min-h-[160px]"
            style={{
              backgroundColor: action.bgColor,
              boxShadow: familyTheme.card.shadow
            }}
          >
            <span className="text-5xl">{action.icon}</span>
            <span
              className="font-bold"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: action.textColor
              }}
            >
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Navigation hint */}
      <div
        className="mt-12 text-center"
        style={{
          fontSize: familyTheme.typography.small.size,
          color: familyTheme.colors.textTertiary
        }}
      >
        برای دیدن کارت‌های بعدی به بالا بکشید
      </div>
    </div>
  )
}
