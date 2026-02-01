'use client'

import { useState } from 'react'
import { BottomSheet, Button, Avatar } from '@/components/ui'
import { formatMoney } from '@/lib/utils/money'
import { deserializeAvatar, type Avatar as AvatarData } from '@/lib/types/avatar'

interface Participant {
  id: string
  name: string
  avatar?: string | null
}

interface Settlement {
  id: string
  amount: number
  fromId: string
  toId: string
  note?: string | null
  receiptUrl?: string | null
  settledAt: string | Date
  from: Participant
  to: Participant
  createdAt: string | Date
}

interface SettlementHistorySheetProps {
  isOpen: boolean
  onClose: () => void
  settlements: Settlement[]
  currency: string
}

/**
 * Settlement history display with filtering and export options
 *
 * UX Principle: Transparency = Trust
 * Users should be able to see all past settlements with full details
 */
export function SettlementHistorySheet({
  isOpen,
  onClose,
  settlements,
  currency,
}: SettlementHistorySheetProps) {
  const [showCount, setShowCount] = useState(5)
  const [filter, setFilter] = useState<'all' | 'last20' | 'lastWeek'>('all')

  // Apply filters
  const filteredSettlements = settlements.filter((settlement) => {
    if (filter === 'all') return true

    if (filter === 'last20') {
      return settlements.indexOf(settlement) < 20
    }

    if (filter === 'lastWeek') {
      const settleDate = new Date(settlement.settledAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return settleDate >= weekAgo
    }

    return true
  })

  const displayedSettlements = filteredSettlements.slice(0, showCount)
  const hasMore = filteredSettlements.length > showCount

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['تاریخ', 'پرداخت‌کننده', 'دریافت‌کننده', 'مبلغ', 'توضیحات']
    const rows = filteredSettlements.map(s => [
      formatDate(s.settledAt),
      s.from.name,
      s.to.name,
      formatMoney(s.amount, currency),
      s.note || '-'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `settlements-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            تاریخچه تسویه‌ها
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Filter Options */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setFilter('last20')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'last20'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            ۲۰ تای آخر
          </button>
          <button
            onClick={() => setFilter('lastWeek')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'lastWeek'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            هفته اخیر
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>📥</span>
          خروجی CSV
        </button>

        {/* Settlements List */}
        {displayedSettlements.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              هنوز تسویه‌ای ثبت نشده
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedSettlements.map((settlement) => (
              <div
                key={settlement.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3"
              >
                {/* Participants */}
                <div className="flex items-center gap-3">
                  {/* From */}
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar
                      avatar={deserializeAvatar(settlement.from.avatar || null, settlement.from.name)}
                      name={settlement.from.name}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {settlement.from.name}
                    </span>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>

                  {/* To */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {settlement.to.name}
                    </span>
                    <Avatar
                      avatar={deserializeAvatar(settlement.to.avatar || null, settlement.to.name)}
                      name={settlement.to.name}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(settlement.settledAt)}
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatMoney(settlement.amount, currency)}
                  </span>
                </div>

                {/* Note */}
                {settlement.note && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-lg p-2">
                    {settlement.note}
                  </p>
                )}

                {/* Receipt */}
                {settlement.receiptUrl && (
                  <a
                    href={settlement.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <span>📎</span>
                    مشاهده رسید
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show More Button */}
        {hasMore && (
          <button
            onClick={() => setShowCount(prev => prev + 10)}
            className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            نمایش بیشتر ({filteredSettlements.length - showCount} تسویه باقی‌مانده)
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
