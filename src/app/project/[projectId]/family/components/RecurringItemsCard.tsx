'use client'

import { useRouter } from 'next/navigation'
import { familyTheme } from '@/styles/family-theme'

interface RecurringItem {
  id: string
  type: 'INCOME' | 'EXPENSE'
  title: string
  amount: number
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  isActive: boolean
  participantName: string
  categoryName?: string
  categoryIcon?: string
}

interface RecurringItemsCardProps {
  items?: RecurringItem[]
  currency?: string
  projectId: string
}

export function RecurringItemsCard({
  items = [],
  currency = 'تومان',
  projectId,
}: RecurringItemsCardProps) {
  const router = useRouter()

  const frequencyLabels = {
    DAILY: 'روزانه',
    WEEKLY: 'هفتگی',
    MONTHLY: 'ماهانه',
    YEARLY: 'سالانه',
  }

  const activeItems = items.filter((item) => item.isActive)
  const inactiveItems = items.filter((item) => !item.isActive)

  return (
    <div
      className="h-screen w-full flex flex-col p-6 snap-start overflow-hidden"
      style={{ backgroundColor: familyTheme.colors.background }}
    >
      {/* Header */}
      <div className="text-center mb-6 pt-6">
        <h2
          className="font-bold mb-2"
          style={{
            fontSize: '28px',
            fontWeight: familyTheme.typography.pageTitle.weight,
            color: familyTheme.colors.textPrimary
          }}
        >
          تراکنش‌های تکراری
        </h2>
        <p
          style={{
            fontSize: familyTheme.typography.body.size,
            color: familyTheme.colors.textSecondary
          }}
        >
          {activeItems.length} فعال · {inactiveItems.length} غیرفعال
        </p>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {items.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: familyTheme.colors.card,
              boxShadow: familyTheme.card.shadow
            }}
          >
            <span className="text-5xl mb-4 block">🔄</span>
            <p
              className="mb-4"
              style={{
                fontSize: familyTheme.typography.body.size,
                color: familyTheme.colors.textSecondary
              }}
            >
              تراکنش تکراری ثبت نشده است
            </p>
            <button
              onClick={() =>
                router.push(`/project/${projectId}/family/recurring/add`)
              }
              className="text-white px-6 py-2 rounded-full font-medium transition-colors hover:opacity-90"
              style={{
                fontSize: familyTheme.typography.body.size,
                backgroundColor: familyTheme.colors.primary
              }}
            >
              افزودن تراکنش تکراری
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl p-4 transition-all ${
                item.isActive ? 'opacity-100' : 'opacity-60'
              }`}
              style={{
                backgroundColor: familyTheme.colors.card,
                boxShadow: familyTheme.card.shadow
              }}
            >
              <div className="flex items-start justify-between">
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.categoryIcon && (
                      <span className="text-lg">{item.categoryIcon}</span>
                    )}
                    <span
                      className="font-medium"
                      style={{
                        fontSize: familyTheme.typography.body.size,
                        color: familyTheme.colors.textPrimary
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: familyTheme.typography.small.size,
                        backgroundColor:
                          item.type === 'INCOME'
                            ? familyTheme.colors.successSoft
                            : familyTheme.colors.dangerSoft,
                        color:
                          item.type === 'INCOME'
                            ? familyTheme.colors.success
                            : familyTheme.colors.danger
                      }}
                    >
                      {item.type === 'INCOME' ? 'درآمد' : 'هزینه'}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-4"
                    style={{
                      fontSize: familyTheme.typography.body.size,
                      color: familyTheme.colors.textSecondary
                    }}
                  >
                    <div>
                      <span
                        className="font-bold"
                        style={{ color: familyTheme.colors.textPrimary }}
                      >
                        {item.amount.toLocaleString('fa-IR')}
                      </span>{' '}
                      {currency}
                    </div>
                    <div>· {frequencyLabels[item.frequency]}</div>
                    <div>· {item.participantName}</div>
                  </div>
                </div>

                {/* Status indicator */}
                <div
                  className="px-3 py-1 rounded-full font-medium"
                  style={{
                    fontSize: familyTheme.typography.small.size,
                    backgroundColor: item.isActive
                      ? familyTheme.colors.successSoft
                      : familyTheme.colors.divider,
                    color: item.isActive
                      ? familyTheme.colors.success
                      : familyTheme.colors.textSecondary
                  }}
                >
                  {item.isActive ? '✓ فعال' : '⏸ غیرفعال'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View All button */}
      {items.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => router.push(`/project/${projectId}/family/recurring`)}
            className="w-full px-6 py-3 rounded-full font-medium transition-colors hover:opacity-90"
            style={{
              fontSize: familyTheme.typography.body.size,
              backgroundColor: familyTheme.colors.card,
              color: familyTheme.colors.primary,
              border: `1px solid ${familyTheme.colors.primary}`,
              boxShadow: familyTheme.card.shadow
            }}
          >
            مدیریت تراکنش‌های تکراری →
          </button>
        </div>
      )}

      {/* Bottom spacing */}
      <div className="h-6" />
    </div>
  )
}
