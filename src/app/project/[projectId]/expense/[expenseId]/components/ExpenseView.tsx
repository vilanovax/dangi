'use client'

import { Card, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface ExpenseShare {
  participantId: string
  participant: Participant
  amount: number
}

interface ExpenseViewProps {
  title: string
  amount: number
  description?: string | null
  receiptUrl?: string | null
  currency: string
  expenseDate: string
  paidBy: Participant
  category?: Category | null
  shares: ExpenseShare[]
}

/**
 * Read-only view of expense details
 * Clean, minimal design - just the facts
 */
export function ExpenseView({
  title,
  amount,
  description,
  receiptUrl,
  currency,
  expenseDate,
  paidBy,
  category,
  shares,
}: ExpenseViewProps) {
  const categoryBgColor = category?.color ? `${category.color}20` : '#6B728020'

  return (
    <div className="p-4 space-y-5">
      {/* Main Info Card */}
      <Card className="text-center py-6">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ backgroundColor: categoryBgColor }}
        >
          <span className="text-3xl">{category?.icon || '📝'}</span>
        </div>
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {formatMoney(amount, currency)}
        </p>
        {category && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{category.name}</p>
        )}
        {description && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
          </div>
        )}
      </Card>

      {/* Receipt Image */}
      {receiptUrl && (
        <Card className="overflow-hidden">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">تصویر رسید</p>
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptUrl}
              alt="رسید"
              className="w-full rounded-xl object-cover max-h-64"
            />
            <p className="text-xs text-blue-500 mt-2 text-center">برای مشاهده کامل کلیک کنید</p>
          </a>
        </Card>
      )}

      {/* Paid By */}
      <Card>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">پرداخت‌کننده</p>
        <div className="flex items-center gap-3">
          <Avatar
            avatar={deserializeAvatar(paidBy.avatar || null, paidBy.name)}
            name={paidBy.name}
            size="lg"
          />
          <div>
            <p className="font-medium">{paidBy.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(expenseDate).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Split Details */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تقسیم بین {shares.length} نفر
        </h3>
        <Card className="divide-y divide-gray-100 dark:divide-gray-800">
          {shares.map((share) => (
            <div
              key={share.participantId}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  avatar={deserializeAvatar(
                    share.participant.avatar || null,
                    share.participant.name
                  )}
                  name={share.participant.name}
                  size="md"
                />
                <span>{share.participant.name}</span>
              </div>
              <span className="font-medium">{formatMoney(share.amount, currency)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
