'use client'

import { useState } from 'react'

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
  items: RecurringItem[]
  currency: string
  onToggle: (id: string) => void
}

export function RecurringItemsCard({
  items,
  currency,
  onToggle,
}: RecurringItemsCardProps) {
  const frequencyLabels = {
    DAILY: 'روزانه',
    WEEKLY: 'هفتگی',
    MONTHLY: 'ماهانه',
    YEARLY: 'سالانه',
  }

  const activeItems = items.filter((item) => item.isActive)
  const inactiveItems = items.filter((item) => !item.isActive)

  return (
    <div className="h-screen w-full bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex flex-col p-6 snap-start overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6 pt-6">
        <h2 className="text-3xl font-bold text-stone-800 mb-2">
          تراکنش‌های تکراری
        </h2>
        <p className="text-sm text-stone-600">
          {activeItems.length} فعال · {inactiveItems.length} غیرفعال
        </p>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {items.length === 0 ? (
          <div className="bg-white/70 rounded-2xl p-8 text-center">
            <span className="text-5xl mb-4 block">🔄</span>
            <p className="text-stone-600 mb-4">
              تراکنش تکراری ثبت نشده است
            </p>
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors">
              افزودن تراکنش تکراری
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-md transition-all ${
                item.isActive ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.categoryIcon && (
                      <span className="text-lg">{item.categoryIcon}</span>
                    )}
                    <span className="font-medium text-stone-800">
                      {item.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.type === 'INCOME'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.type === 'INCOME' ? 'درآمد' : 'هزینه'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-stone-600">
                    <div>
                      <span className="font-bold text-stone-800">
                        {item.amount.toLocaleString('fa-IR')}
                      </span>{' '}
                      {currency}
                    </div>
                    <div>· {frequencyLabels[item.frequency]}</div>
                    <div>· {item.participantName}</div>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => onToggle(item.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    item.isActive ? 'bg-green-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      item.isActive ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-6" />
    </div>
  )
}
